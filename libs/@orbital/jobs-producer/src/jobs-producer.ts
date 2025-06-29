import { Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { SchedulerRegistry } from "@nestjs/schedule";
import { MicroserviceManagerEvents } from "@orbital/microservices";
import { SingletonIntervalService } from "@orbital/singleton-interval";
import {
  makeCounterProvider,
  makeGaugeProvider,
} from "@willsoto/nestjs-prometheus";
import archy from "archy";
import type { Job, Queue } from "bull";
import _ from "lodash";
import type { Counter, Gauge } from "prom-client";

export enum JobsProducerMarkProcessingOrder {
  PRE_PRODUCE,
  POST_PRODUCE,
}

export type JobItem = {
  _id: string;
};

export type JobsProducerSummary<
  SuccessSummary = number,
  FailSummary = number,
> = {
  total: number;
  success: SuccessSummary;
  fail: FailSummary;
};

/**
 * Abstract base class that handles:
 * - Periodically pulling “pending” items from a DB queue
 *   and enqueuing them into a BullMQ queue (in bulk, up to batch size).
 * - Periodically fetching “completed” and “failed” jobs from Bull, and
 *   invoking subclass hooks to persist results in bulk.
 *
 * To use:
 *   1) Subclass JobsProducer and override the abstract methods below.
 *   2) In your subclass’s constructor, inject a `Queue` instance (via @InjectQueue)
 *      and pass it to super().
 *
 * Anything with “fetchPendingItems” or “handleSuccessfulResults” is left for the subclass
 * to implement against your own persistent store.
 */
export abstract class JobsProducer<
  DataType = JobItem,
  SuccessSummary = number,
  FailSummary = number,
> implements OnModuleInit
{
  protected readonly logger = new Logger(JobsProducer.name);
  protected static readonly PAUSED_LOG_THROTTLE_MS = 30_000;
  private paused = false;
  private lastUnavailableMicroservice?: string;
  private lastPausedLog = 0;
  /**
   * Called when producer is paused due to unavailable dependencies.
   * Encapsulates pause logic and centralized logging.
   */
  protected onPaused(): number {
    const now = Date.now();
    if (now - this.lastPausedLog > JobsProducer.PAUSED_LOG_THROTTLE_MS) {
      const micro = this.lastUnavailableMicroservice ?? "dependency";
      this.logger.warn(
        `Microservice not available: [${micro}]. This is a frequent operation so only logging once every ${
          JobsProducer.PAUSED_LOG_THROTTLE_MS / 1000
        } seconds.`
      );
      this.lastPausedLog = now;
    }
    return 0;
  }
  protected readonly verbose: boolean = false;

  constructor(
    protected readonly queue: Queue,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly produceProfileGauge: Gauge,
    protected readonly pendingItemsProfileGauge: Gauge,
    protected readonly markProcessingProfileGauge: Gauge,
    protected readonly persistProfileGauge: Gauge,
    protected readonly successCounter: Counter,
    protected readonly failCounter: Counter,
    protected readonly queueSizeGauge: Gauge,
    protected readonly runningConsumersGauge: Gauge,
    protected readonly schedulerRegistry?: SchedulerRegistry
  ) {
    this.logger = new Logger(this.constructor.name);
    this.queueSizeGauge = queueSizeGauge;
    this.pendingItemsProfileGauge = pendingItemsProfileGauge;
    this.markProcessingProfileGauge = markProcessingProfileGauge;
    // Initialize runningConsumersGauge safely
    if (
      this.runningConsumersGauge &&
      typeof this.runningConsumersGauge.reset === "function"
    ) {
      this.runningConsumersGauge.reset();
      this.runningConsumersGauge.set({ queue: this.queue.name }, 0);
    }
    this.scheduleIntervals();
  }

  private lastNoPendingLog: number = 0;

  public onModuleInit(): void {
    this.eventEmitter.on(
      MicroserviceManagerEvents.Unavailable,
      ({ microservice }: { microservice: string }) => {
        if (!this.paused) {
          this.logger.warn(
            `Paused producer: dependency '${microservice}' unavailable`
          );
          this.paused = true;
          this.lastUnavailableMicroservice = microservice;
        }
      }
    );
    this.eventEmitter.on(
      MicroserviceManagerEvents.Available,
      ({ microservice }: { microservice: string }) => {
        if (this.paused) {
          this.logger.log(
            `Resumed producer: dependency '${microservice}' available`
          );
          this.paused = false;
          this.lastUnavailableMicroservice = undefined;
        }
      }
    );
  }

  /**
   * Specify microservices that must be available for intervals.
   * Subclasses can override to return specific dependencies.
   */
  protected microserviceDependencies(): string[] {
    return [];
  }

  private scheduleIntervals(): void {
    const deps = this.microserviceDependencies();

    const produceIntervalService = new SingletonIntervalService(
      `${this.constructor.name}.produce`,
      this.produce.bind(this),
      this.productionFrequency(),
      { microservices: deps }
    );
    produceIntervalService.registerWithScheduler(this);

    const persistIntervalService = new SingletonIntervalService(
      `${this.constructor.name}.persist`,
      this.persist.bind(this),
      this.persistanceFrequency(),
      { microservices: deps }
    );
    persistIntervalService.registerWithScheduler(this);
  }

  private heartbeat(): void {
    const now = Date.now();
    if (now - this.lastNoPendingLog > 20_000 && !this.paused) {
      this.logger.verbose(`No pending items...`);
      this.lastNoPendingLog = now;
    }
  }

  /**
   * Determines when to mark items as processing (PRE_PRODUCE or POST_PRODUCE).
   * Subclasses can override.
   */
  protected markProcessingOrder(): JobsProducerMarkProcessingOrder {
    return JobsProducerMarkProcessingOrder.POST_PRODUCE;
  }

  /**
   * Determine whether to forbid scheduling duplicates. Subclasses can override.
   */
  public forbidDuplicates(): boolean {
    return false;
  }

  /**
   * By default returns an empty array. Subclasses can override to specify which
   * fields from DataType should be used as additional Prometheus labels.
   * Each string is a JSON path (lodash 'get' style).
   */
  protected metricsLabels(): string[] {
    return [];
  }

  /**
   * Return the field name to use as the unique key for duplicate checking. Subclasses can override.
   */
  public uniqueKey(): keyof DataType {
    return "_id" as keyof DataType;
  }

  private readonly scheduledKeys = new Set<string>();

  public consumerConcurrency(): number {
    return Math.ceil(this.queueSize() / 10) || 1;
  }

  /**
   * The “heartbeat” interval (in ms) for fetching new items and enqueuing them.
   * Subclass can override to change frequency.
   */
  public productionFrequency(): number {
    return 3000;
  }

  /**
   * The “heartbeat” interval (in ms) for collecting completed/failed jobs and persisting.
   * Subclass can override to change frequency.
   */
  public persistanceFrequency(): number {
    return 3000;
  }

  /**
   * How many items to fetch from the persistent queue per iteration.
   * If queueWaitingCount >= batchSize, we skip scheduling.
   */
  public queueSize(): number {
    return 100;
  }

  /**
   * The Bull job “name” (i.e. the first argument to queue.add).
   * Inheriting classes should return something like 'scrapeProfile' or 'processTask', etc.
   */
  public abstract jobName(): string;

  /**
   * Called by scheduleJobs() to pull up to `limit` items from your persistent store.
   * Return an array of whatever you want to enqueue as job data (string, object, DTO, etc.).
   *
   * @param limit how many items to fetch (typically this.getBatchSize())
   * @returns an array of “pending” items to be enqueued
   */
  protected abstract pendingItems(): Promise<DataType[]>;

  protected abstract markItemsAsProcessing(
    items: Job<DataType>[]
  ): Promise<void>;

  /**
   * Called by persistJobsResults() when one or more jobs have completed.
   * You receive an array of CompletedJobInfo, each containing job.data + job.returnvalue.
   * You should bulk‐persist results back to your own database, and return how many you handled.
   *
   * @param successful one array entry per completed job
   * @returns the count of items that were successfully persisted
   */
  protected abstract onSuccess(
    successful: Job<DataType>[]
  ): Promise<SuccessSummary>;

  /**
   * Called by persistJobsResults() when one or more jobs have failed.
   * You receive an array of FailedJobInfo, each containing job.data + job.returnvalue (error).
   * You should bulk‐persist failures (e.g. mark “not found” vs. “errored”), and return totals.
   *
   * @param failed one array entry per failed job
   * @returns an object { totalFailed: number; notFoundCount: number; }
   */
  protected abstract onFail(failed: Job<DataType>[]): Promise<FailSummary>;

  /**
   * The main “producer” loop:
   * 1) Check queue.getWaitingCount(); if >= batchSize, do nothing.
   * 2) Otherwise, fetchPendingItems(batchSize) from your DB.
   * 3) Enqueue each item in bulk via queue.addBulk.
   *
   * If no items or queue is full, this method simply returns 0.
   */
  protected async produce(): Promise<number> {
    await this.updateConsumerCount();
    if (this.paused) {
      return this.onPaused();
    }
    const producerLabel = this.constructor.name;
    const startProduce = Date.now();
    try {
      const waitingCount = await this.queue.getWaitingCount();
      const delayedCount = await this.queue.getDelayedCount();
      const activeCount = await this.queue.getActiveCount();
      const outstanding = waitingCount + delayedCount + activeCount;

      this.queueSizeGauge.set(
        { producer: producerLabel, queue: this.queue.name },
        outstanding
      );

      if (outstanding >= this.queueSize()) {
        this.verbose &&
          this.logger.debug(
            `produce: there are already jobs waiting or delayed (${outstanding}), skipping.`
          );
        return 0;
      }

      // 2) Fetch up to batchSize new items
      let pendingItems: DataType[];
      try {
        const startPending = Date.now();
        pendingItems = await this.pendingItems();

        if (!Array.isArray(pendingItems)) {
          throw new Error(
            `produce: Unexpected data of type ${pendingItems}, expected array of job data items`
          );
        }

        pendingItems = pendingItems.slice(0, this.queueSize());
        const durationPending = Date.now() - startPending;
        this.pendingItemsProfileGauge.set(
          { producer: producerLabel, queue: this.queue.name },
          durationPending
        );
      } catch (err: any) {
        this.logger.error(
          `produce: error fetching pending items: ${err.message}`,
          err.stack
        );
        return 0;
      }
      if (!pendingItems || pendingItems.length === 0) {
        this.verbose && this.heartbeat();
        return 0;
      }

      // 3) If duplicate prevention is enabled, filter out items already scheduled
      if (this.forbidDuplicates()) {
        const keyField = this.uniqueKey();
        // 3a) Collect keys from waiting jobs in Redis
        let waitingJobs: Job<DataType>[];
        try {
          waitingJobs = await this.queue.getWaiting();
        } catch (err: any) {
          this.logger.error(
            `produce: error fetching waiting jobs: ${err.message}`,
            err.stack
          );
          return 0;
        }
        const waitingKeys = new Set<string>(
          waitingJobs.map((job) => (job.data as any)[keyField]).filter(Boolean)
        );
        // Combine waiting keys with already scheduled ones
        const existingKeys = new Set<string>([
          ...waitingKeys,
          ...this.scheduledKeys,
        ]);
        // Track count before filtering
        const originalCount = pendingItems.length;
        // Filter pendingItems to only those not in existingKeys
        pendingItems = pendingItems.filter(
          (item: any) => !existingKeys.has(item[keyField])
        );
        const filteredCount = pendingItems.length;
        const duplicateCount = originalCount - filteredCount;
        if (duplicateCount > 0) {
          this.logger.warn(
            `produce: detected ${duplicateCount} duplicate item(s), skipping them.`
          );
        }
        if (pendingItems.length === 0) {
          if (this.verbose) {
            this.logger.debug(
              `produce: all fetched items are duplicates, skipping.`
            );
          }
          return 0;
        }
      }

      const keyField: keyof DataType = this.uniqueKey();

      // If verbose, log the items that will be enqueued using archy
      if (this.verbose) {
        const tree = {
          label: `Queue: ${this.queue.name} | produce`,
          nodes: pendingItems.map((item) => ({
            label: String((item as DataType)[keyField]),
            nodes: [],
          })),
        };
        this.logger.log("\n" + archy(tree));
      }

      // 3) Build bulk‐submission payload
      // Each entry: { name: <jobName>, data: <the item> }
      const jobName = this.jobName();
      const bulkOps = pendingItems.map((item) => {
        const keyValue = String((item as DataType)[keyField]);
        return {
          name: jobName,
          data: item,
          opts: { jobId: keyValue },
        };
      });

      // Determine when to mark items as processing
      const order = this.markProcessingOrder();
      if (order === JobsProducerMarkProcessingOrder.PRE_PRODUCE) {
        // Create pseudo‐jobs from pendingItems so markItemsAsProcessing can run before enqueue
        const pseudoJobs = pendingItems.map(
          (item) => ({ data: item }) as Job<DataType>
        );
        const startMark = Date.now();
        await this.markItemsAsProcessing(pseudoJobs);
        const durationMark = Date.now() - startMark;
        this.markProcessingProfileGauge.set(
          { producer: producerLabel, queue: this.queue.name },
          durationMark
        );
      }

      // Enqueue all in one bulk call
      const jobs: Job<DataType>[] = await this.queue.addBulk(bulkOps);

      if (order === JobsProducerMarkProcessingOrder.POST_PRODUCE) {
        const startMark = Date.now();
        await this.markItemsAsProcessing(jobs);
        const durationMark = Date.now() - startMark;
        this.markProcessingProfileGauge.set(
          { producer: producerLabel, queue: this.queue.name },
          durationMark
        );
      }

      this.logger.log(
        `produce: enqueued ${jobs.length}/${pendingItems.length} jobs to queue "${jobName}".`
      );

      // 4) Record keys of newly scheduled items to prevent duplicates
      if (this.forbidDuplicates()) {
        const keyField = this.uniqueKey();
        for (const job of jobs) {
          const keyValue = (job.data as any)[keyField];
          if (keyValue) {
            this.scheduledKeys.add(keyValue);
          } else {
            this.logger.error(
              `produce: failed to record scheduled key: job.data missing uniqueKey field "${String(
                keyField
              )}".`
            );
          }
        }
      }

      return jobs.length;
    } finally {
      const durationMs = Date.now() - startProduce;
      this.produceProfileGauge.set(
        { producer: producerLabel, queue: this.queue.name },
        durationMs
      );
    }
  }

  public successMessage(summary: SuccessSummary) {
    this.logger.log(`persisted results for ${summary} successful job(s)`);
  }

  public failMessage(summary: FailSummary, failed: Job<DataType>[]) {
    if (this.verbose) {
      const keyField = this.uniqueKey() as string;
      const tree = {
        label: `${failed.length} failed jobs`,
        nodes: failed.map((job) => {
          const uniqueId = String((job.data as any)[keyField]);
          return {
            label: `\u001b[31m${this.jobName()} ${uniqueId}: ${
              job.failedReason || "No error message"
            }\u001b[0m`,
            nodes:
              job.stacktrace && job.stacktrace.length > 0 ? job.stacktrace : [],
          };
        }),
      };
      this.logger.error("Failed jobs:\n" + archy(tree));
    } else {
      this.logger.log(`persisted failures for ${summary} failed jobs`);
    }
  }

  /**
   * The main “persistor” loop:
   * 1) Grab a batch of completed jobs (up to 2× batchSize) via queue.getJobs(['completed']).
   *    If any found, extract their data + returnvalue and call handleSuccessfulResults().
   *    Then remove those jobs via queue.clean(0, 'completed', count).
   * 2) Grab a batch of failed jobs (up to 2× batchSize) via queue.getJobs(['failed']).
   *    If any found, separate “Not Found” vs. other errors,
   *    call handleFailedResults() with the array, then queue.clean(0, 'failed', count).
   */
  protected async persist(): Promise<void> {
    if (this.paused) {
      return;
    }
    const producerLabel = this.constructor.name;
    const startPersist = Date.now();
    try {
      const batchSize = this.queueSize() * 2;

      // --------------------
      // a) Handle “completed” jobs
      // --------------------
      const completedJobs: Job<DataType>[] = await this.queue.getJobs(
        ["completed"],
        0,
        batchSize - 1
      );
      if (completedJobs.length > 0) {
        try {
          const summary: SuccessSummary = await this.onSuccess(completedJobs);

          // 1) Increment the overall success counter
          this.successCounter.inc(
            { producer: producerLabel, queue: this.queue.name },
            Number(summary)
          );

          // Track success metrics in bulk by labels
          this.trackMetricsByFields(
            this.successCounter,
            completedJobs,
            producerLabel
          );
          this.verbose && this.successMessage(summary);

          // Now remove those completed jobs from Redis in one go:
          await this.queue.clean(0, "completed", completedJobs.length);
        } catch (err: any) {
          this.logger.error(`Error in onSuccess: ${err.message}`, err.stack);
        }
      }

      // --------------------
      // b) Handle “failed” jobs
      // --------------------
      const failedJobs: Job<DataType>[] = await this.queue.getJobs(
        ["failed"],
        0,
        batchSize - 1
      );
      if (failedJobs.length > 0) {
        try {
          const summary: FailSummary = await this.onFail(failedJobs);

          // 1) Increment the overall failure counter
          this.failCounter.inc(
            { producer: producerLabel, queue: this.queue.name },
            Number(summary)
          );

          // Track failure metrics in bulk by labels
          this.trackMetricsByFields(
            this.failCounter,
            failedJobs,
            producerLabel
          );
          this.failMessage(summary, failedJobs);

          // Remove those failed jobs from Redis in bulk:
          await this.queue.clean(0, "failed", failedJobs.length);
        } catch (err: any) {
          this.logger.error(`Error in onFail: ${err.message}`, err.stack);
        }
      }
    } finally {
      const durationPersist = Date.now() - startPersist;
      this.persistProfileGauge.set(
        { producer: producerLabel, queue: this.queue.name },
        durationPersist
      );
    }
  }

  /**
   * Given a Counter metric, a set of jobs, and the base producer label,
   * increment the metric once per unique combination of measureByFields.
   */
  protected trackMetricsByFields(
    metric: Counter,
    jobs: Job<DataType>[],
    producerLabel: string
  ) {
    const extraFields = this.metricsLabels();
    if (extraFields.length === 0) {
      return;
    }

    // Precompute sanitized label names
    const sanitizedFields = extraFields.map((path) => path.replace(/\./g, "_"));

    // Initialize a map for each sanitized field: fieldName -> (value -> count)
    const counts: Record<string, Map<string, number>> = {};
    sanitizedFields.forEach((labelName) => {
      counts[labelName] = new Map<string, number>();
    });

    // Perform a single pass over all jobs, updating counts for each field
    for (const job of jobs) {
      extraFields.forEach((path, idx) => {
        const labelName = sanitizedFields[idx];
        const rawValue = _.get(job.data as any, path);
        const value = rawValue !== undefined ? String(rawValue) : "";
        const fieldMap = counts[labelName];
        fieldMap.set(value, (fieldMap.get(value) || 0) + 1);
      });
    }

    // Now increment the metric once per distinct value of each field
    for (const labelName of sanitizedFields) {
      const fieldMap = counts[labelName];
      for (const [value, count] of fieldMap) {
        const labels: Record<string, string> = {
          producer: producerLabel,
          queue: this.queue.name,
        };
        labels[labelName] = value;
        metric.inc(labels, count);
      }
    }
  }

  async updateConsumerCount() {
    try {
      // In Bull v3, getWorkers() returns metadata for each worker connected
      const workerInfos = await this.queue.getWorkers();
      const consumerCount = Array.isArray(workerInfos) ? workerInfos.length : 0;
      this.runningConsumersGauge.set({ queue: this.queue.name }, consumerCount);
    } catch (err: any) {
      this.logger.warn(`Error updating consumer count: ${err.message}`);
    }
  }
}

export const makeJobsProducerMetricsProviders = (
  extraLabelNames: string[] = []
) => {
  const baseLabels = ["producer", "queue"];
  const sanitizedExtras = extraLabelNames.map((path) =>
    path.replace(/\./g, "_")
  );
  const allLabels = Array.from(new Set([...baseLabels, ...sanitizedExtras]));

  return [
    makeGaugeProvider({
      name: JobsProducerMetricNames.PRODUCE_PROFILE,
      help: "Duration of JobsProducer.produce() in milliseconds",
      labelNames: baseLabels,
    }),
    makeGaugeProvider({
      name: JobsProducerMetricNames.PENDING_ITEMS_PROFILE,
      help: "Duration of pendingItems() in milliseconds",
      labelNames: baseLabels,
    }),
    makeGaugeProvider({
      name: JobsProducerMetricNames.MARK_PROCESSING_PROFILE,
      help: "Duration of markItemsAsProcessing() in milliseconds",
      labelNames: baseLabels,
    }),
    makeGaugeProvider({
      name: JobsProducerMetricNames.PERSIST_PROFILE,
      help: "Duration of persist() in milliseconds",
      labelNames: baseLabels,
    }),
    makeGaugeProvider({
      name: JobsProducerMetricNames.QUEUE_SIZE,
      help: "Number of outstanding jobs in the queue (waiting + delayed)",
      labelNames: baseLabels,
    }),

    // success counter now uses allLabels (producer, queue, plus any extras)
    makeCounterProvider({
      name: JobsProducerMetricNames.PERSISTED_SUCCESS_TOTAL,
      help: "Number of jobs successfully persisted by persist()",
      labelNames: allLabels,
    }),

    // failure counter also uses allLabels
    makeCounterProvider({
      name: JobsProducerMetricNames.PERSISTED_FAIL_TOTAL,
      help: "Number of jobs failed persisted by persist()",
      labelNames: allLabels,
    }),
    makeGaugeProvider({
      name: JobsProducerMetricNames.RUNNING_CONSUMERS,
      help: "Number of JobsQueueConsumer instances currently running",
      labelNames: ["queue"],
    }),
  ];
};

export enum JobsProducerMetricNames {
  PRODUCE_PROFILE = "jobs_queue_producer_produce_profile",
  PENDING_ITEMS_PROFILE = "jobs_queue_producer_pending_items_profile",
  MARK_PROCESSING_PROFILE = "jobs_queue_producer_mark_processing_profile",
  PERSIST_PROFILE = "jobs_queue_producer_persist_profile",
  QUEUE_SIZE = "jobs_queue_producer_queue_size",
  PERSISTED_SUCCESS_TOTAL = "jobs_queue_producer_jobs_persisted_success_total",
  PERSISTED_FAIL_TOTAL = "jobs_queue_producer_jobs_persisted_fail_total",
  RUNNING_CONSUMERS = "jobs_queue_consumer_running_consumers",
}
