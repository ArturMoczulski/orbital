import { Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
export declare enum JobsProducerMarkProcessingOrder {
    PRE_PRODUCE = 0,
    POST_PRODUCE = 1
}
export type JobItem = {
    _id: string;
};
export type JobsProducerSummary<SuccessSummary = number, FailSummary = number> = {
    total: number;
    success: SuccessSummary;
    fail: FailSummary;
};
export declare abstract class JobsProducer<DataType = JobItem, SuccessSummary = number, FailSummary = number> implements OnModuleInit {
    protected readonly queue: Queue;
    protected readonly eventEmitter: EventEmitter2;
    protected readonly produceProfileGauge: Gauge;
    protected readonly pendingItemsProfileGauge: Gauge;
    protected readonly markProcessingProfileGauge: Gauge;
    protected readonly persistProfileGauge: Gauge;
    protected readonly successCounter: Counter;
    protected readonly failCounter: Counter;
    protected readonly queueSizeGauge: Gauge;
    protected readonly runningConsumersGauge: Gauge;
    protected readonly schedulerRegistry?: SchedulerRegistry;
    protected readonly logger: Logger;
    protected static readonly PAUSED_LOG_THROTTLE_MS = 30000;
    private paused;
    private lastUnavailableMicroservice?;
    private lastPausedLog;
    protected onPaused(): number;
    protected readonly verbose: boolean;
    constructor(queue: Queue, eventEmitter: EventEmitter2, produceProfileGauge: Gauge, pendingItemsProfileGauge: Gauge, markProcessingProfileGauge: Gauge, persistProfileGauge: Gauge, successCounter: Counter, failCounter: Counter, queueSizeGauge: Gauge, runningConsumersGauge: Gauge, schedulerRegistry?: SchedulerRegistry);
    private lastNoPendingLog;
    onModuleInit(): void;
    protected microserviceDependencies(): string[];
    private scheduleIntervals;
    private heartbeat;
    protected markProcessingOrder(): JobsProducerMarkProcessingOrder;
    forbidDuplicates(): boolean;
    protected metricsLabels(): string[];
    uniqueKey(): keyof DataType;
    private readonly scheduledKeys;
    consumerConcurrency(): number;
    productionFrequency(): number;
    persistanceFrequency(): number;
    queueSize(): number;
    abstract jobName(): string;
    protected abstract pendingItems(): Promise<DataType[]>;
    protected abstract markItemsAsProcessing(items: Job<DataType>[]): any;
    protected abstract onSuccess(successful: Job<DataType>[]): Promise<SuccessSummary>;
    protected abstract onFail(failed: Job<DataType>[]): Promise<FailSummary>;
    protected produce(): Promise<number>;
    successMessage(summary: SuccessSummary): void;
    failMessage(summary: FailSummary, failed: Job<DataType>[]): void;
    protected persist(): Promise<void>;
    protected trackMetricsByFields(metric: Counter, jobs: Job<DataType>[], producerLabel: string): void;
    updateConsumerCount(): Promise<void>;
}
export declare const makeJobsProducerMetricsProviders: (extraLabelNames?: string[]) => any[];
export declare enum JobsProducerMetricNames {
    PRODUCE_PROFILE = "jobs_queue_producer_produce_profile",
    PENDING_ITEMS_PROFILE = "jobs_queue_producer_pending_items_profile",
    MARK_PROCESSING_PROFILE = "jobs_queue_producer_mark_processing_profile",
    PERSIST_PROFILE = "jobs_queue_producer_persist_profile",
    QUEUE_SIZE = "jobs_queue_producer_queue_size",
    PERSISTED_SUCCESS_TOTAL = "jobs_queue_producer_jobs_persisted_success_total",
    PERSISTED_FAIL_TOTAL = "jobs_queue_producer_jobs_persisted_fail_total",
    RUNNING_CONSUMERS = "jobs_queue_consumer_running_consumers"
}
