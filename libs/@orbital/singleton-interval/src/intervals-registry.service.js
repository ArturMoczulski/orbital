"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IntervalsRegistryService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntervalsRegistryService = exports.IntervalState = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const singleton_interval_service_1 = require("./singleton-interval.service");
/** Represents the current state of an interval's latest run. */
var IntervalState;
(function (IntervalState) {
    IntervalState["INIT"] = "INIT";
    IntervalState["LATE"] = "LATE";
    IntervalState["RUNNING"] = "RUNNING";
    IntervalState["SLOW"] = "SLOW";
    IntervalState["JAMMED"] = "JAMMED";
    IntervalState["HEALTHY"] = "HEALTHY";
    IntervalState["STOPPED"] = "STOPPED";
    IntervalState["ERROR"] = "ERROR";
    IntervalState["CONDITIONS_NOT_MET"] = "CONDITIONS_NOT_MET";
    IntervalState["MICROSERVICES_UNAVAILABLE"] = "MICROSERVICES_UNAVAILABLE";
})(IntervalState || (exports.IntervalState = IntervalState = {}));
/**
 * This service listens to the events emitted by the SingletonInterval decorator.
 * Whenever a method starts, finishes, errors, etc., we update our in-memory registry
 * so we can produce a status report later.
 */
let IntervalsRegistryService = IntervalsRegistryService_1 = class IntervalsRegistryService {
    constructor(eventEmitter, schedulerRegistry, discoveryService) {
        this.eventEmitter = eventEmitter;
        this.schedulerRegistry = schedulerRegistry;
        this.discoveryService = discoveryService;
        this.logger = new common_1.Logger(IntervalsRegistryService_1.name);
        /**
         * Our in-memory store of interval records, keyed by `uniqueKey`.
         * (e.g. "MyService.myMethod")
         */
        this.registry = new Map();
    }
    onModuleInit() {
        // Initialize event emitter and scheduler
        singleton_interval_service_1.SingletonIntervalService.eventEmitter = this.eventEmitter;
        singleton_interval_service_1.SingletonIntervalService.setSchedulerRegistry(this.schedulerRegistry);
        // Process pending decorator-defined intervals
        const wrappers = [
            ...this.discoveryService.getProviders(),
            ...this.discoveryService.getControllers(),
        ];
        for (const def of singleton_interval_service_1.SingletonIntervalService.pendingDefinitions) {
            for (const wrapper of wrappers) {
                if (wrapper.metatype === def.targetClass && wrapper.instance) {
                    const svc = new singleton_interval_service_1.SingletonIntervalService(def.key, def.originalMethod, def.interval, def.options);
                    svc.registerWithScheduler(wrapper.instance);
                    this.register(def.key, def.interval);
                }
            }
        }
        // Clear pending definitions
        singleton_interval_service_1.SingletonIntervalService.pendingDefinitions = [];
        // Register static interval definitions
        singleton_interval_service_1.SingletonIntervalService.intervalDefinitions.forEach((interval, intervalName) => {
            this.register(intervalName, interval.interval);
        });
        // Flush pending registrations to scheduler
        singleton_interval_service_1.SingletonIntervalService.flushPendingRegistrations();
        // Log unified list of all registered intervals
        this.registry.forEach((record, key) => this.logger.log(`Registered singleton interval: ${key} [${record.intervalMs}ms]`));
    }
    /**
     * Manually register an interval if desired.
     * Some people prefer calling this from the decorator, but with event-based
     * approach, you can also do it from a "Started" event if the record doesn't exist.
     */
    register(uniqueKey, intervalMs) {
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
    getIntervalRecord(uniqueKey) {
        return this.registry.get(uniqueKey);
    }
    /**
     * Produce a snapshot of all intervals' statuses for debugging or health checks.
     */
    getStatusReport() {
        const now = Date.now();
        const results = [];
        for (const [uniqueKey, record] of this.registry.entries()) {
            const { intervalMs, createTime, lastStart, lastDuration, locked, lastError, notMetConditions, microservicesUnavailable, } = record;
            const conditionsNotMet = !!(notMetConditions === null || notMetConditions === void 0 ? void 0 : notMetConditions.length);
            const elapsedSinceStart = now - lastStart;
            const elapsedSinceCreate = now - createTime;
            let status;
            if (!locked && lastStart === 0) {
                // Never started
                if (elapsedSinceCreate < intervalMs) {
                    status = IntervalState.INIT;
                }
                else {
                    status = IntervalState.LATE;
                }
            }
            else if (locked) {
                // Currently running
                if (lastError) {
                    status = IntervalState.ERROR;
                }
                else if (elapsedSinceStart <= intervalMs) {
                    status = IntervalState.RUNNING;
                }
                else if (elapsedSinceStart <= intervalMs * 10) {
                    status = IntervalState.SLOW;
                }
                else {
                    status = IntervalState.JAMMED;
                }
            }
            else {
                // Not locked => has finished or is being skipped
                if (microservicesUnavailable) {
                    status = IntervalState.MICROSERVICES_UNAVAILABLE;
                }
                else if (conditionsNotMet) {
                    status = IntervalState.CONDITIONS_NOT_MET;
                }
                else if (lastError) {
                    status = IntervalState.ERROR;
                }
                else if (elapsedSinceStart <= intervalMs) {
                    status = IntervalState.HEALTHY;
                }
                else if (elapsedSinceStart > intervalMs * 10) {
                    status = IntervalState.STOPPED;
                }
                else {
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
    handleStarted(payload) {
        const { intervalName } = payload;
        const record = this.registry.get(intervalName);
        record.lastStart = Date.now();
        record.locked = true;
        record.notMetConditions = undefined;
        record.microservicesUnavailable = false;
    }
    handleConditionsNotMet(payload) {
        const record = this.registry.get(payload.intervalName);
        record.notMetConditions = payload.failedConditions;
        record.locked = false;
    }
    handleMicroservicesUnresponsive(payload) {
        const record = this.registry.get(payload.intervalName);
        record.microservicesUnavailable = true;
        record.locked = false;
    }
    handleError(payload) {
        const record = this.registry.get(payload.intervalName);
        record.lastError = payload.error;
    }
    handleSuccess(payload) {
        const record = this.registry.get(payload.intervalName);
        record.lastError = undefined;
    }
    handleFinish(payload) {
        var _a;
        const record = this.registry.get(payload.intervalName);
        record.lastDuration = (_a = payload.elapsed) !== null && _a !== void 0 ? _a : 0;
        record.locked = false;
    }
    handleTerminated(payload) {
        const record = this.registry.get(payload.intervalName);
        record.lastError = payload.error;
        record.locked = false;
    }
};
exports.IntervalsRegistryService = IntervalsRegistryService;
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.Started}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleStarted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.ConditionsNotMet}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleConditionsNotMet", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.MicroservicesUnresponsive}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleMicroservicesUnresponsive", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.Error}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleError", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.Success}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleSuccess", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.Finish}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleFinish", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`**.${singleton_interval_service_1.SingletonIntervalEvents.Terminated}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntervalsRegistryService.prototype, "handleTerminated", null);
exports.IntervalsRegistryService = IntervalsRegistryService = IntervalsRegistryService_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2, typeof (_a = typeof schedule_1.SchedulerRegistry !== "undefined" && schedule_1.SchedulerRegistry) === "function" ? _a : Object, core_1.DiscoveryService])
], IntervalsRegistryService);
//# sourceMappingURL=intervals-registry.service.js.map