import { Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Job, Queue } from "bull";
import { JobItem } from "./jobs-producer";
import { makeGaugeProvider } from "@willsoto/nestjs-prometheus";
import { Gauge } from "prom-client";
import {
  MicroserviceManagerEvents,
  ScoutMicroservices,
} from "../microservice-manager/microservice-manager.service";

export abstract class JobsQueueConsumer<TData = JobItem>
  implements OnModuleInit
{
  protected readonly logger = new Logger(this.constructor.name);
  private paused = false;
  // Track which dependencies are currently unavailable
  private unavailableDeps = new Set<ScoutMicroservices>();

  constructor(
    protected readonly queue: Queue,
    protected readonly consumeProfileGauge: Gauge,
    protected readonly eventEmitter: EventEmitter2
  ) {}

  public onModuleInit(): void {
    const deps = this.microserviceDependencies();
    if (!deps.length) return;

    this.registerDependencyListeners(deps);
  }

  // Refactored event-listening logic into dedicated methods
  private registerDependencyListeners(deps: ScoutMicroservices[]): void {
    this.eventEmitter.on(MicroserviceManagerEvents.Unavailable, (payload) =>
      this.dependencyUnavailableHandler(payload, deps)
    );
    this.eventEmitter.on(MicroserviceManagerEvents.Available, (payload) =>
      this.dependencyAvailableHandler(payload, deps)
    );
  }

  private dependencyUnavailableHandler(
    { microservice }: { microservice: ScoutMicroservices },
    deps: ScoutMicroservices[]
  ): void {
    if (deps.includes(microservice)) {
      this.unavailableDeps.add(microservice);
      if (!this.paused) {
        this.queue.pause();
        this.logger.warn(`Microservices '${microservice}' unavailable`);
        this.paused = true;
      }
    }
  }

  private dependencyAvailableHandler(
    { microservice }: { microservice: ScoutMicroservices },
    deps: ScoutMicroservices[]
  ): void {
    if (deps.includes(microservice)) {
      this.unavailableDeps.delete(microservice);
      if (this.paused && this.unavailableDeps.size === 0) {
        this.queue.resume();
        this.logger.log(
          `Resumed consumer: all microservices '${microservice}' available`
        );
        this.paused = false;
      }
    }
  }

  /**
   * Override to specify microservices that must be available to process jobs.
   */
  protected microserviceDependencies(): ScoutMicroservices[] {
    return [];
  }

  /**
   * Subclasses must implement this to provide the unique key in the job data.
   */
  protected abstract uniqueKey(): keyof TData;

  /**
   * Subclasses must implement this to perform the actual job-specific processing.
   */
  protected abstract consume(job: Job<TData>): Promise<any>;

  /**
   * Generic handler named by subclasses with @Process decorator.
   * Subclass @Process method should call this.
   */
  public async process(job: Job<TData>): Promise<any> {
    const start = Date.now();
    try {
      return await this.consume(job);
    } finally {
      const duration = Date.now() - start;
      this.consumeProfileGauge.set({ queue: this.queue.name }, duration);
    }
  }
}

export enum JobsConsumerMetricNames {
  CONSUME_PROFILE = "jobs_queue_consumer_consume_profile",
}

export const makeJobsConsumerMetricsProviders = () =>
  makeGaugeProvider({
    name: JobsConsumerMetricNames.CONSUME_PROFILE,
    help: "Duration of process() in milliseconds",
    labelNames: ["queue"],
  });
