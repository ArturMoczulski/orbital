"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventName = exports.getIntervalName = exports.IntervalTerminated = exports.SingletonIntervalEvents = exports.INTERVAL_TERMINATION_FACTOR = void 0;
exports.SingletonInterval = SingletonInterval;
const singleton_interval_service_1 = require("./singleton-interval.service");
/**
 * Decorator shorthand for SingletonIntervalService
 */
function SingletonInterval(milliseconds, options) {
    return (target, propertyKey, descriptor) => {
        const methodName = propertyKey.toString();
        const key = `${target.constructor.name}.${methodName}`;
        // Register decorator‐defined interval for registry processing
        singleton_interval_service_1.SingletonIntervalService.pendingDefinitions.push({
            targetClass: target.constructor,
            key,
            originalMethod: descriptor.value,
            interval: milliseconds,
            options,
        });
        // Create service to manage execution
        const service = new singleton_interval_service_1.SingletonIntervalService(key, descriptor.value, milliseconds, options);
        // Override the method so it always runs through the service
        descriptor.value = function (...args) {
            return service.run(this, args);
        };
        return descriptor;
    };
}
// Preserve static references for backward compatibility and tests
(function (SingletonInterval) {
    SingletonInterval.eventEmitter = singleton_interval_service_1.SingletonIntervalService.eventEmitter;
    SingletonInterval.globalMutexMap = singleton_interval_service_1.SingletonIntervalService.globalMutexMap;
    SingletonInterval.initEmittedFor = singleton_interval_service_1.SingletonIntervalService.initEmittedFor;
    SingletonInterval.intervalDefinitions = singleton_interval_service_1.SingletonIntervalService.intervalDefinitions;
    SingletonInterval.isMicroserviceResponsive = singleton_interval_service_1.SingletonIntervalService.isMicroserviceResponsive;
})(SingletonInterval || (exports.SingletonInterval = SingletonInterval = {}));
// Re-export types and utilities
var singleton_interval_service_2 = require("./singleton-interval.service");
Object.defineProperty(exports, "INTERVAL_TERMINATION_FACTOR", { enumerable: true, get: function () { return singleton_interval_service_2.INTERVAL_TERMINATION_FACTOR; } });
Object.defineProperty(exports, "SingletonIntervalEvents", { enumerable: true, get: function () { return singleton_interval_service_2.SingletonIntervalEvents; } });
Object.defineProperty(exports, "IntervalTerminated", { enumerable: true, get: function () { return singleton_interval_service_2.IntervalTerminated; } });
Object.defineProperty(exports, "getIntervalName", { enumerable: true, get: function () { return singleton_interval_service_2.getIntervalName; } });
Object.defineProperty(exports, "getEventName", { enumerable: true, get: function () { return singleton_interval_service_2.getEventName; } });
//# sourceMappingURL=singleton-interval.decorator.js.map