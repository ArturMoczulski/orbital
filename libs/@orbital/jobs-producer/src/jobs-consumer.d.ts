import { Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JobItem } from "./jobs-producer";
export declare abstract class JobsQueueConsumer<TData = JobItem> implements OnModuleInit {
    protected readonly queue: Queue;
    protected readonly consumeProfileGauge: Gauge;
    protected readonly eventEmitter: EventEmitter2;
    protected readonly logger: Logger;
    private paused;
    private unavailableDeps;
    constructor(queue: Queue, consumeProfileGauge: Gauge, eventEmitter: EventEmitter2);
    onModuleInit(): void;
    private registerDependencyListeners;
    private dependencyUnavailableHandler;
    private dependencyAvailableHandler;
    protected microserviceDependencies(): string[];
    protected abstract uniqueKey(): keyof TData;
    protected abstract consume(job: Job<TData>): Promise<any>;
    process(job: Job<TData>): Promise<any>;
}
export declare enum JobsConsumerMetricNames {
    CONSUME_PROFILE = "jobs_queue_consumer_consume_profile"
}
export declare const makeJobsConsumerMetricsProviders: () => any;
