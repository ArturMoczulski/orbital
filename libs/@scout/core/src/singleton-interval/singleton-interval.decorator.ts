import {
  SingletonIntervalService,
  SingletonIntervalOptions,
} from "./singleton-interval.service";

/**
 * Decorator shorthand for SingletonIntervalService
 */
export function SingletonInterval(
  milliseconds: number,
  options?: SingletonIntervalOptions
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const methodName = propertyKey.toString();
    const key = `${target.constructor.name}.${methodName}`;
    // Register decorator‐defined interval for registry processing
    SingletonIntervalService.pendingDefinitions.push({
      targetClass: target.constructor,
      key,
      originalMethod: descriptor.value!,
      interval: milliseconds,
      options,
    });
    // Create service to manage execution
    const service = new SingletonIntervalService(
      key,
      descriptor.value!,
      milliseconds,
      options
    );
    // Override the method so it always runs through the service
    descriptor.value = function (...args: any[]) {
      return service.run(this, args);
    };
    return descriptor;
  };
}

// Preserve static references for backward compatibility and tests
export namespace SingletonInterval {
  export const eventEmitter = SingletonIntervalService.eventEmitter;
  export const globalMutexMap = SingletonIntervalService.globalMutexMap;
  export const initEmittedFor = SingletonIntervalService.initEmittedFor;
  export const intervalDefinitions =
    SingletonIntervalService.intervalDefinitions;
  export let isMicroserviceResponsive =
    SingletonIntervalService.isMicroserviceResponsive;
}

// Re-export types and utilities
export {
  INTERVAL_TERMINATION_FACTOR,
  SingletonIntervalEvents,
  SingletonIntervalDefinition,
  SingletonIntervalOptions,
  IntervalTerminated,
  getIntervalName,
  getEventName,
} from "./singleton-interval.service";
