import { Mutex } from "async-mutex";
import { Logger, LoggerService } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SchedulerRegistry } from "@nestjs/schedule";
import {} from "async-mutex";
import humanizeDuration from "humanize-duration";

export enum SingletonIntervalEvents {
  Init = "Init",
  Started = "Started",
  AlreadyRunning = "AlreadyRunning",
  ConditionsNotMet = "ConditionsNotMet",
  Terminated = "Terminated",
  Error = "Error",
  Success = "Success",
  LongRunning = "LongRunning",
  Finish = "Finish",
  MicroservicesUnresponsive = "MicroservicesUnresponsive",
}

export type SingletonIntervalOptions = {
  finally?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onTerminate?: () => Promise<void>;
  conditions?: Record<string, () => Promise<boolean>>;
  microservices?: string[];
};

export type SingletonIntervalDefinition = {
  name: string;
  interval: number;
  finally?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onTerminate?: () => Promise<void>;
  conditions?: Record<string, () => Promise<boolean>>;
  microservices?: string[];
};

export class IntervalTerminated extends Error {
  constructor(intervalName: string, interval: number) {
    super(
      `${intervalName}: ❌ terminated due to exceeding time limit of ${
        SingletonIntervalService.INTERVAL_TERMINATION_FACTOR * interval
      } ms (${SingletonIntervalService.INTERVAL_TERMINATION_FACTOR} x interval)`
    );
  }
}

export function getIntervalName(className: string, methodName: string): string {
  return `${className}.${methodName}`;
}

export function getEventName(
  name: string,
  event: SingletonIntervalEvents
): string {
  return `${name}.${event}`;
}

export class SingletonIntervalService {
  /** Pending registrations until schedulerRegistry is set */
  private static pendingRegistrations: Array<{
    service: SingletonIntervalService;
    context: any;
  }> = [];
  /** Pending decorator definitions until instances are discovered */
  public static pendingDefinitions: Array<{
    targetClass: any;
    key: string;
    originalMethod: (...args: any[]) => Promise<any>;
    interval: number;
    options?: SingletonIntervalOptions;
  }> = [];
  public static eventEmitter?: EventEmitter2;
  public static schedulerRegistry?: SchedulerRegistry;

  /**
   * Flush any intervals queued while schedulerRegistry was unset.
   */
  public static flushPendingRegistrations(): void {
    for (const { service, context } of this.pendingRegistrations) {
      service.registerWithScheduler(context);
    }
    this.pendingRegistrations = [];
  }

  /** Set Nest’s SchedulerRegistry for dynamic interval registration. Flush pending registrations. */
  public static setSchedulerRegistry(registry: SchedulerRegistry) {
    this.schedulerRegistry = registry;
  }
  public static globalMutexMap = new Map<string, Mutex>();
  public static initEmittedFor = new Set<string>();
  public static intervalDefinitions = new Map<
    string,
    { name: string; interval: number }
  >();
  public static lastConditionsNotMetLogTime = new Map<string, number>();
  public static appStartTimeMs = Date.now();
  public static initialSuppressMs = 45 * 1000;
  public static isMicroserviceResponsive?: (name: string) => Promise<boolean>;
  public static lastInactiveLogTime = new Map<string, number>();
  public static INACTIVE_LOG_THROTTLE_MS = 45 * 1000;
  public static NOT_MET_LOG_THROTTLE_MS = 60 * 1000;
  public static SHOULD_THROTTLE_NOT_MET_LOGS = true;
  public static CONDITION_TIMEOUT_MS = 15 * 1000;
  public static INTERVAL_TERMINATION_FACTOR = 20;

  private readonly uniqueKey: string;
  private readonly originalMethod: (...args: any[]) => Promise<any>;
  private readonly intervalMs: number;
  private readonly options?: SingletonIntervalOptions;
  private readonly logger: LoggerService;
  private readonly mutex: Mutex;
  private readonly combinedConditions: Record<string, () => Promise<boolean>>;
  private enabledFlag = true;

  public get enabled(): boolean {
    return this.enabledFlag;
  }

  public set enabled(value: boolean) {
    this.enabledFlag = value;
  }

  constructor(
    uniqueKey: string,
    originalMethod: (...args: any[]) => Promise<any>,
    intervalMs: number,
    options?: SingletonIntervalOptions
  ) {
    this.uniqueKey = uniqueKey;
    this.originalMethod = originalMethod;
    this.intervalMs = intervalMs;
    this.options = options;
    this.logger = new Logger(this.uniqueKey);

    if (!SingletonIntervalService.globalMutexMap.has(this.uniqueKey)) {
      SingletonIntervalService.globalMutexMap.set(this.uniqueKey, new Mutex());
    }
    this.mutex = SingletonIntervalService.globalMutexMap.get(this.uniqueKey)!;

    if (!SingletonIntervalService.intervalDefinitions.has(this.uniqueKey)) {
      SingletonIntervalService.intervalDefinitions.set(this.uniqueKey, {
        name: this.uniqueKey,
        interval: intervalMs,
      });
    }

    this.combinedConditions = this.buildConditions();
    SingletonIntervalService.lastConditionsNotMetLogTime.set(
      this.uniqueKey,
      Date.now()
    );
  }

  public async run(context: any, args: any[]): Promise<void> {
    const emitter = SingletonIntervalService.eventEmitter;
    const release = await this.preRun(emitter);
    if (!release) return;
    await this.executeWithTimeoutAndEvents(context, args, release, emitter);
  }

  /**
   * Dynamically register this interval via Nest’s SchedulerRegistry.
   * Requires SchedulerRegistry set via setSchedulerRegistry().
   */
  public registerWithScheduler(context: any): void {
    const reg = SingletonIntervalService.schedulerRegistry;
    if (!reg) {
      // Queue until schedulerRegistry is configured (avoid duplicates)
      if (
        !SingletonIntervalService.pendingRegistrations.some(
          (r) => r.service === this
        )
      ) {
        SingletonIntervalService.pendingRegistrations.push({
          service: this,
          context,
        });
      }
      return;
    }
    // Prevent duplicate scheduling if already registered
    if (reg.getIntervals().includes(this.uniqueKey)) {
      this.logger.warn(
        `Interval '${this.uniqueKey}' already registered, skipping duplicate.`
      );
      return;
    }
    const timer = setInterval(() => this.run(context, []), this.intervalMs);
    try {
      this.logger.log(`Registering singleton interval: ${this.uniqueKey}`);
      reg.addInterval(this.uniqueKey, timer);
    } catch (err) {
      this.logger.warn(
        `Interval '${this.uniqueKey}' already registered, skipping duplicate.`
      );
    }
  }

  private buildConditions(): Record<string, () => Promise<boolean>> {
    const conditions: Record<string, () => Promise<boolean>> = {};
    if (this.options?.conditions) {
      Object.assign(conditions, this.options.conditions);
    }
    if (this.options?.microservices) {
      for (const name of this.options.microservices) {
        conditions[`Microservice ${name} available`] = async () => {
          if (!SingletonIntervalService.isMicroserviceResponsive) {
            this.logger.error(
              `[${this.uniqueKey}] No health-check provided for '${name}', treating as down.`
            );
            return false;
          }
          try {
            return await SingletonIntervalService.isMicroserviceResponsive(
              name
            );
          } catch {
            this.logger.error(
              `[${this.uniqueKey}] Error checking microservice '${name}'.`
            );
            return false;
          }
        };
      }
    }
    return conditions;
  }

  private async checkConditions(): Promise<string[]> {
    const notMet: string[] = [];
    for (const [name, fn] of Object.entries(this.combinedConditions)) {
      let timeoutHandle: NodeJS.Timeout;
      try {
        const result = await Promise.race([
          fn().catch(() => false),
          new Promise<boolean>((_, reject) => {
            timeoutHandle = setTimeout(
              () => reject(new Error(`Condition '${name}' timed out`)),
              SingletonIntervalService.CONDITION_TIMEOUT_MS
            );
          }),
        ]);
        if (!result) notMet.push(name);
      } catch {
        notMet.push(name);
      } finally {
        clearTimeout(timeoutHandle!);
      }
    }
    return notMet;
  }

  private logConditionsNotMet(notMet: string[]): void {
    const now = Date.now();
    if (
      now - SingletonIntervalService.appStartTimeMs <
      SingletonIntervalService.initialSuppressMs
    ) {
      const nonMicro = notMet.filter((n) => !n.startsWith("Microservice "));
      if (nonMicro.length) {
        this.logger.warn(`Conditions not met: [${nonMicro.join(", ")}].`);
      }
      return;
    }
    const lastLog = SingletonIntervalService.lastConditionsNotMetLogTime.get(
      this.uniqueKey
    )!;
    if (
      !SingletonIntervalService.SHOULD_THROTTLE_NOT_MET_LOGS ||
      now - lastLog > SingletonIntervalService.NOT_MET_LOG_THROTTLE_MS
    ) {
      this.logger.warn(
        `Conditions not met: [${notMet.join(", ")}]. ${humanizeDuration(
          this.intervalMs
        )} interval.`
      );
      SingletonIntervalService.lastConditionsNotMetLogTime.set(
        this.uniqueKey,
        now
      );
    }
  }

  private async handleConditionsStage(): Promise<boolean> {
    const emitter = SingletonIntervalService.eventEmitter;
    const notMet = await this.checkConditions();
    if (!notMet.length) return true;
    this.logConditionsNotMet(notMet);
    emitter?.emit(
      getEventName(this.uniqueKey, SingletonIntervalEvents.ConditionsNotMet),
      { intervalName: this.uniqueKey, failedConditions: notMet }
    );
    const unresp = notMet.filter((c) => c.startsWith("Microservice "));
    if (unresp.length) {
      emitter?.emit(
        getEventName(
          this.uniqueKey,
          SingletonIntervalEvents.MicroservicesUnresponsive
        ),
        { intervalName: this.uniqueKey, unresponsive: unresp }
      );
    }
    return false;
  }

  private emitInit(): void {
    const emitter = SingletonIntervalService.eventEmitter;
    if (!SingletonIntervalService.initEmittedFor.has(this.uniqueKey)) {
      emitter?.emit(
        getEventName(this.uniqueKey, SingletonIntervalEvents.Init),
        { intervalName: this.uniqueKey, intervalMs: this.intervalMs }
      );
      SingletonIntervalService.initEmittedFor.add(this.uniqueKey);
    }
  }

  private handleAlreadyRunning(): boolean {
    if (this.mutex.isLocked()) {
      SingletonIntervalService.eventEmitter?.emit(
        getEventName(this.uniqueKey, SingletonIntervalEvents.AlreadyRunning),
        { intervalName: this.uniqueKey }
      );
      return true;
    }
    return false;
  }

  private handleDisabled(): void {
    const now = Date.now();
    const lastLog =
      SingletonIntervalService.lastInactiveLogTime.get(this.uniqueKey) || 0;
    if (now - lastLog > SingletonIntervalService.INACTIVE_LOG_THROTTLE_MS) {
      this.logger.warn(`Interval '${this.uniqueKey}' is disabled.`);
      SingletonIntervalService.lastInactiveLogTime.set(this.uniqueKey, now);
    }
  }

  private async preRun(
    emitter?: EventEmitter2
  ): Promise<() => void | undefined> {
    this.emitInit();
    if (this.enabled) {
      if (this.handleAlreadyRunning()) {
        return undefined;
      }
      const release = await this.acquireLock();
      if (!release) {
        return undefined;
      }
      if (!(await this.handleConditionsStage())) {
        release();
        return undefined;
      }
      emitter?.emit(
        getEventName(this.uniqueKey, SingletonIntervalEvents.Started),
        { intervalName: this.uniqueKey }
      );
      return release;
    } else {
      this.handleDisabled();
      return undefined;
    }
  }

  private async handleFinally(): Promise<void> {
    if (this.options?.finally) {
      try {
        await this.options.finally();
      } catch (e) {
        this.logger.error(`Error in finally handler: ${e}`);
      }
    }
  }

  private async handleError(err: Error): Promise<void> {
    if (this.options?.onError) {
      try {
        await this.options.onError(err);
      } catch (e) {
        this.logger.error(`Error in onError handler: ${e}`);
      }
    }
    SingletonIntervalService.eventEmitter?.emit(
      getEventName(this.uniqueKey, SingletonIntervalEvents.Error),
      { intervalName: this.uniqueKey, error: err }
    );
  }

  private async handleTerminate(err: Error): Promise<void> {
    if (this.options?.onTerminate) {
      try {
        await this.options.onTerminate();
      } catch (e) {
        this.logger.error(`Error in onTerminate handler: ${e}`);
      }
    }
    SingletonIntervalService.eventEmitter?.emit(
      getEventName(this.uniqueKey, SingletonIntervalEvents.Terminated),
      { intervalName: this.uniqueKey, error: err }
    );
  }

  private async acquireLock(): Promise<() => void | undefined> {
    try {
      return await this.mutex.acquire();
    } catch (e) {
      this.logger.error(`Failed to acquire lock: ${e}`);
      return undefined;
    }
  }

  private async executeWithTimeoutAndEvents(
    context: any,
    args: any[],
    release: () => void,
    emitter?: EventEmitter2
  ): Promise<void> {
    let timer: NodeJS.Timeout;
    const start = Date.now();
    try {
      const timeout = new Promise<void>((_, rej) => {
        timer = setTimeout(
          () => rej(new IntervalTerminated(this.uniqueKey, this.intervalMs)),
          SingletonIntervalService.INTERVAL_TERMINATION_FACTOR * this.intervalMs
        );
      });
      await Promise.race([this.originalMethod.apply(context, args), timeout]);
      emitter?.emit(
        getEventName(this.uniqueKey, SingletonIntervalEvents.Success),
        { intervalName: this.uniqueKey }
      );
    } catch (err) {
      if (err instanceof IntervalTerminated) {
        await this.handleTerminate(err);
      } else {
        await this.handleError(err as Error);
      }
    } finally {
      clearTimeout(timer!);
      release();
      const elapsed = Date.now() - start;
      if (elapsed > this.intervalMs) {
        this.logger.warn(`Long run: ${elapsed}ms`);
        emitter?.emit(
          getEventName(this.uniqueKey, SingletonIntervalEvents.LongRunning),
          { intervalName: this.uniqueKey, elapsed }
        );
      }
      await this.handleFinally();
      emitter?.emit(
        getEventName(this.uniqueKey, SingletonIntervalEvents.Finish),
        { intervalName: this.uniqueKey, elapsed }
      );
    }
  }
}
export const INTERVAL_TERMINATION_FACTOR =
  SingletonIntervalService.INTERVAL_TERMINATION_FACTOR;
