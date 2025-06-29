import { EventEmitter2 } from "@nestjs/event-emitter";
import { Mutex } from "async-mutex";
export declare enum SingletonIntervalEvents {
    Init = "Init",
    Started = "Started",
    AlreadyRunning = "AlreadyRunning",
    ConditionsNotMet = "ConditionsNotMet",
    Terminated = "Terminated",
    Error = "Error",
    Success = "Success",
    LongRunning = "LongRunning",
    Finish = "Finish",
    MicroservicesUnresponsive = "MicroservicesUnresponsive"
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
export declare class IntervalTerminated extends Error {
    constructor(intervalName: string, interval: number);
}
export declare function getIntervalName(className: string, methodName: string): string;
export declare function getEventName(name: string, event: SingletonIntervalEvents): string;
export declare class SingletonIntervalService {
    /** Pending registrations until schedulerRegistry is set */
    private static pendingRegistrations;
    /** Pending decorator definitions until instances are discovered */
    static pendingDefinitions: Array<{
        targetClass: any;
        key: string;
        originalMethod: (...args: any[]) => Promise<any>;
        interval: number;
        options?: SingletonIntervalOptions;
    }>;
    static eventEmitter?: EventEmitter2;
    static schedulerRegistry?: SchedulerRegistry;
    /**
     * Flush any intervals queued while schedulerRegistry was unset.
     */
    static flushPendingRegistrations(): void;
    /** Set Nest’s SchedulerRegistry for dynamic interval registration. Flush pending registrations. */
    static setSchedulerRegistry(registry: SchedulerRegistry): void;
    static globalMutexMap: Map<string, Mutex>;
    static initEmittedFor: Set<string>;
    static intervalDefinitions: Map<string, {
        name: string;
        interval: number;
    }>;
    static lastConditionsNotMetLogTime: Map<string, number>;
    static appStartTimeMs: number;
    static initialSuppressMs: number;
    static isMicroserviceResponsive?: (name: string) => Promise<boolean>;
    static lastInactiveLogTime: Map<string, number>;
    static INACTIVE_LOG_THROTTLE_MS: number;
    static NOT_MET_LOG_THROTTLE_MS: number;
    static SHOULD_THROTTLE_NOT_MET_LOGS: boolean;
    static CONDITION_TIMEOUT_MS: number;
    static INTERVAL_TERMINATION_FACTOR: number;
    private readonly uniqueKey;
    private readonly originalMethod;
    private readonly intervalMs;
    private readonly options?;
    private readonly logger;
    private readonly mutex;
    private readonly combinedConditions;
    private enabledFlag;
    get enabled(): boolean;
    set enabled(value: boolean);
    constructor(uniqueKey: string, originalMethod: (...args: any[]) => Promise<any>, intervalMs: number, options?: SingletonIntervalOptions);
    run(context: any, args: any[]): Promise<void>;
    /**
     * Dynamically register this interval via Nest’s SchedulerRegistry.
     * Requires SchedulerRegistry set via setSchedulerRegistry().
     */
    registerWithScheduler(context: any): void;
    private buildConditions;
    private checkConditions;
    private logConditionsNotMet;
    private handleConditionsStage;
    private emitInit;
    private handleAlreadyRunning;
    private handleDisabled;
    private preRun;
    private handleFinally;
    private handleError;
    private handleTerminate;
    private acquireLock;
    private executeWithTimeoutAndEvents;
}
export declare const INTERVAL_TERMINATION_FACTOR: number;
