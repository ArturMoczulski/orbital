import { SingletonIntervalOptions } from "./singleton-interval.service";
/**
 * Decorator shorthand for SingletonIntervalService
 */
export declare function SingletonInterval(milliseconds: number, options?: SingletonIntervalOptions): MethodDecorator;
export declare namespace SingletonInterval {
    const eventEmitter: import("eventemitter2").EventEmitter2 | undefined;
    const globalMutexMap: Map<string, import("async-mutex").Mutex>;
    const initEmittedFor: Set<string>;
    const intervalDefinitions: Map<string, {
        name: string;
        interval: number;
    }>;
    let isMicroserviceResponsive: ((name: string) => Promise<boolean>) | undefined;
}
export { INTERVAL_TERMINATION_FACTOR, SingletonIntervalEvents, SingletonIntervalDefinition, SingletonIntervalOptions, IntervalTerminated, getIntervalName, getEventName, } from "./singleton-interval.service";
