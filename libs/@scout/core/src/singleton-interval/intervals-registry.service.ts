import { Global, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { SchedulerRegistry } from "@nestjs/schedule";
import { SingletonInterval } from "./singleton-interval.decorator";
import {
  SingletonIntervalService,
  SingletonIntervalDefinition,
  SingletonIntervalEvents,
} from "./singleton-interval.service";
import { last } from "lodash";

/** Represents the current state of an interval's latest run. */
export enum IntervalState {
  INIT = "INIT",
  LATE = "LATE",
  RUNNING = "RUNNING",
  SLOW = "SLOW",
  JAMMED = "JAMMED",
  HEALTHY = "HEALTHY",
  STOPPED = "STOPPED",
  ERROR = "ERROR",
  CONDITIONS_NOT_MET = "CONDITIONS_NOT_MET",
  MICROSERVICES_UNAVAILABLE = "MICROSERVICES_UNAVAILABLE",
}

/**
 * Internal data we track about each unique interval.
 */
export interface IntervalRecord {
  intervalMs: number;
  createTime: number;
  lastStart: number;
  lastDuration: number; // in ms; 0 if never completed
  locked: boolean; // whether the interval is currently running
  lastError?: Error;
  notMetConditions?: string[];
  microservicesUnavailable?: boolean;
}

/**
 * A snapshot of an interval's status, for external reporting.
 */
export interface IntervalStatus {
  key: string; // e.g. "MyService.myMethod"
  status: IntervalState;
  locked: boolean;
  lastDuration: number;
  lastError?: Error;
  notMetConditions?: string[];
  microservicesUnavailable?: boolean;
}

/**
 * This service listens to the events emitted by the SingletonInterval decorator.
 * Whenever a method starts, finishes, errors, etc., we update our in-memory registry
 * so we can produce a status report later.
 */
@Global()
@Injectable()
export class IntervalsRegistryService implements OnModuleInit {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly discoveryService: DiscoveryService
  ) {}

  private readonly logger: Logger = new Logger(IntervalsRegistryService.name);

  onModuleInit(): void {
    // Initialize event emitter and scheduler
    SingletonIntervalService.eventEmitter = this.eventEmitter;
    SingletonIntervalService.setSchedulerRegistry(this.schedulerRegistry);

    // Process pending decorator-defined intervals
    const wrappers = [
      ...this.discoveryService.getProviders(),
      ...this.discoveryService.getControllers(),
    ];
    for (const def of SingletonIntervalService.pendingDefinitions) {
      for (const wrapper of wrappers) {
        if (wrapper.metatype === def.targetClass && wrapper.instance) {
          const svc = new SingletonIntervalService(
            def.key,
            def.originalMethod,
            def.interval,
            def.options
          );
          svc.registerWithScheduler(wrapper.instance);
          this.register(def.key, def.interval);
        }
      }
    }
    // Clear pending definitions
    SingletonIntervalService.pendingDefinitions = [];

    // Register static interval definitions
    SingletonIntervalService.intervalDefinitions.forEach(
      (interval: SingletonIntervalDefinition, intervalName: string) => {
        this.register(intervalName, interval.interval);
      }
    );

    // Flush pending registrations to scheduler
    SingletonIntervalService.flushPendingRegistrations();

    // Log unified list of all registered intervals
    this.registry.forEach((record, key) =>
      this.logger.log(
        `Registered singleton interval: ${key} [${record.intervalMs}ms]`
      )
    );
  }

  /**
   * Our in-memory store of interval records, keyed by `uniqueKey`.
   * (e.g. "MyService.myMethod")
   */
  private readonly registry = new Map<string, IntervalRecord>();

  /**
   * Manually register an interval if desired.
   * Some people prefer calling this from the decorator, but with event-based
   * approach, you can also do it from a "Started" event if the record doesn't exist.
   */
  public register(uniqueKey: string, intervalMs: number): void {
    if (!this.registry.has(uniqueKey)) {
      this.registry.set(uniqueKey, {
        intervalMs,
        createTime: Date.now(),
        lastStart: 0,
        lastDuration: 0,
        locked: false,
      });
    }
  }

  /**
   * Get the raw record if you need it for debugging.
   */
  public getIntervalRecord(uniqueKey: string): IntervalRecord | undefined {
    return this.registry.get(uniqueKey);
  }

  /**
   * Produce a snapshot of all intervals' statuses for debugging or health checks.
   */
  public getStatusReport(): IntervalStatus[] {
    const now = Date.now();
    const results: IntervalStatus[] = [];

    for (const [uniqueKey, record] of this.registry.entries()) {
      const {
        intervalMs,
        createTime,
        lastStart,
        lastDuration,
        locked,
        lastError,
        notMetConditions,
        microservicesUnavailable,
      } = record;

      const conditionsNotMet = !!notMetConditions?.length;
      const elapsedSinceStart = now - lastStart;
      const elapsedSinceCreate = now - createTime;

      let status: IntervalState;

      if (!locked && lastStart === 0) {
        // Never started
        if (elapsedSinceCreate < intervalMs) {
          status = IntervalState.INIT;
        } else {
          status = IntervalState.LATE;
        }
      } else if (locked) {
        // Currently running
        if (lastError) {
          status = IntervalState.ERROR;
        } else if (elapsedSinceStart <= intervalMs) {
          status = IntervalState.RUNNING;
        } else if (elapsedSinceStart <= intervalMs * 10) {
          status = IntervalState.SLOW;
        } else {
          status = IntervalState.JAMMED;
        }
      } else {
        // Not locked => has finished or is being skipped
        if (microservicesUnavailable) {
          status = IntervalState.MICROSERVICES_UNAVAILABLE;
        } else if (conditionsNotMet) {
          status = IntervalState.CONDITIONS_NOT_MET;
        } else if (lastError) {
          status = IntervalState.ERROR;
        } else if (elapsedSinceStart <= intervalMs) {
          status = IntervalState.HEALTHY;
        } else if (elapsedSinceStart > intervalMs * 10) {
          status = IntervalState.STOPPED;
        } else {
          status = IntervalState.HEALTHY;
        }
      }

      results.push({
        key: uniqueKey,
        status,
        locked,
        lastDuration,
        lastError,
        notMetConditions,
        microservicesUnavailable,
      });
    }

    return results;
  }

  // ===========================================================================
  // Event Listeners
  // ---------------------------------------------------------------------------
  @OnEvent(`**.${SingletonIntervalEvents.Started}`)
  handleStarted(payload: {
    intervalName: string;
    intervalMs?: number;
    timestamp: number;
  }) {
    const { intervalName } = payload;
    const record = this.registry.get(intervalName)!;
    record.lastStart = Date.now();
    record.locked = true;
    record.notMetConditions = undefined;
    record.microservicesUnavailable = false;
  }

  @OnEvent(`**.${SingletonIntervalEvents.ConditionsNotMet}`)
  handleConditionsNotMet(payload: {
    intervalName: string;
    failedConditions: string[];
  }) {
    const record = this.registry.get(payload.intervalName)!;
    record.notMetConditions = payload.failedConditions;
    record.locked = false;
  }

  @OnEvent(`**.${SingletonIntervalEvents.MicroservicesUnresponsive}`)
  handleMicroservicesUnresponsive(payload: {
    intervalName: string;
    unresponsiveMicroservices: string[];
  }) {
    const record = this.registry.get(payload.intervalName)!;
    record.microservicesUnavailable = true;
    record.locked = false;
  }

  @OnEvent(`**.${SingletonIntervalEvents.Error}`)
  handleError(payload: { intervalName: string; error: Error }) {
    const record = this.registry.get(payload.intervalName)!;
    record.lastError = payload.error;
  }

  @OnEvent(`**.${SingletonIntervalEvents.Success}`)
  handleSuccess(payload: { intervalName: string; timestamp: number }) {
    const record = this.registry.get(payload.intervalName)!;
    record.lastError = undefined;
  }

  @OnEvent(`**.${SingletonIntervalEvents.Finish}`)
  handleFinish(payload: {
    intervalName: string;
    timestamp: number;
    elapsed?: number;
  }) {
    const record = this.registry.get(payload.intervalName)!;
    record.lastDuration = payload.elapsed ?? 0;
    record.locked = false;
  }

  @OnEvent(`**.${SingletonIntervalEvents.Terminated}`)
  handleTerminated(payload: { intervalName: string; error: Error }) {
    const record = this.registry.get(payload.intervalName)!;
    record.lastError = payload.error;
    record.locked = false;
  }
}
