import { OnModuleInit } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { EventEmitter2 } from "@nestjs/event-emitter";
/** Represents the current state of an interval's latest run. */
export declare enum IntervalState {
    INIT = "INIT",
    LATE = "LATE",
    RUNNING = "RUNNING",
    SLOW = "SLOW",
    JAMMED = "JAMMED",
    HEALTHY = "HEALTHY",
    STOPPED = "STOPPED",
    ERROR = "ERROR",
    CONDITIONS_NOT_MET = "CONDITIONS_NOT_MET",
    MICROSERVICES_UNAVAILABLE = "MICROSERVICES_UNAVAILABLE"
}
/**
 * Internal data we track about each unique interval.
 */
export interface IntervalRecord {
    intervalMs: number;
    createTime: number;
    lastStart: number;
    lastDuration: number;
    locked: boolean;
    lastError?: Error;
    notMetConditions?: string[];
    microservicesUnavailable?: boolean;
}
/**
 * A snapshot of an interval's status, for external reporting.
 */
export interface IntervalStatus {
    key: string;
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
export declare class IntervalsRegistryService implements OnModuleInit {
    private readonly eventEmitter;
    private readonly schedulerRegistry;
    private readonly discoveryService;
    constructor(eventEmitter: EventEmitter2, schedulerRegistry: SchedulerRegistry, discoveryService: DiscoveryService);
    private readonly logger;
    onModuleInit(): void;
    /**
     * Our in-memory store of interval records, keyed by `uniqueKey`.
     * (e.g. "MyService.myMethod")
     */
    private readonly registry;
    /**
     * Manually register an interval if desired.
     * Some people prefer calling this from the decorator, but with event-based
     * approach, you can also do it from a "Started" event if the record doesn't exist.
     */
    register(uniqueKey: string, intervalMs: number): void;
    /**
     * Get the raw record if you need it for debugging.
     */
    getIntervalRecord(uniqueKey: string): IntervalRecord | undefined;
    /**
     * Produce a snapshot of all intervals' statuses for debugging or health checks.
     */
    getStatusReport(): IntervalStatus[];
    handleStarted(payload: {
        intervalName: string;
        intervalMs?: number;
        timestamp: number;
    }): void;
    handleConditionsNotMet(payload: {
        intervalName: string;
        failedConditions: string[];
    }): void;
    handleMicroservicesUnresponsive(payload: {
        intervalName: string;
        unresponsiveMicroservices: string[];
    }): void;
    handleError(payload: {
        intervalName: string;
        error: Error;
    }): void;
    handleSuccess(payload: {
        intervalName: string;
        timestamp: number;
    }): void;
    handleFinish(payload: {
        intervalName: string;
        timestamp: number;
        elapsed?: number;
    }): void;
    handleTerminated(payload: {
        intervalName: string;
        error: Error;
    }): void;
}
