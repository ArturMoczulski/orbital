"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERVAL_TERMINATION_FACTOR = exports.SingletonIntervalService = exports.IntervalTerminated = exports.SingletonIntervalEvents = void 0;
exports.getIntervalName = getIntervalName;
exports.getEventName = getEventName;
const common_1 = require("@nestjs/common");
const async_mutex_1 = require("async-mutex");
const humanize_duration_1 = __importDefault(require("humanize-duration"));
var SingletonIntervalEvents;
(function (SingletonIntervalEvents) {
    SingletonIntervalEvents["Init"] = "Init";
    SingletonIntervalEvents["Started"] = "Started";
    SingletonIntervalEvents["AlreadyRunning"] = "AlreadyRunning";
    SingletonIntervalEvents["ConditionsNotMet"] = "ConditionsNotMet";
    SingletonIntervalEvents["Terminated"] = "Terminated";
    SingletonIntervalEvents["Error"] = "Error";
    SingletonIntervalEvents["Success"] = "Success";
    SingletonIntervalEvents["LongRunning"] = "LongRunning";
    SingletonIntervalEvents["Finish"] = "Finish";
    SingletonIntervalEvents["MicroservicesUnresponsive"] = "MicroservicesUnresponsive";
})(SingletonIntervalEvents || (exports.SingletonIntervalEvents = SingletonIntervalEvents = {}));
class IntervalTerminated extends Error {
    constructor(intervalName, interval) {
        super(`${intervalName}: ❌ terminated due to exceeding time limit of ${SingletonIntervalService.INTERVAL_TERMINATION_FACTOR * interval} ms (${SingletonIntervalService.INTERVAL_TERMINATION_FACTOR} x interval)`);
    }
}
exports.IntervalTerminated = IntervalTerminated;
function getIntervalName(className, methodName) {
    return `${className}.${methodName}`;
}
function getEventName(name, event) {
    return `${name}.${event}`;
}
class SingletonIntervalService {
    /**
     * Flush any intervals queued while schedulerRegistry was unset.
     */
    static flushPendingRegistrations() {
        for (const { service, context } of this.pendingRegistrations) {
            service.registerWithScheduler(context);
        }
        this.pendingRegistrations = [];
    }
    /** Set Nest’s SchedulerRegistry for dynamic interval registration. Flush pending registrations. */
    static setSchedulerRegistry(registry) {
        this.schedulerRegistry = registry;
    }
    get enabled() {
        return this.enabledFlag;
    }
    set enabled(value) {
        this.enabledFlag = value;
    }
    constructor(uniqueKey, originalMethod, intervalMs, options) {
        this.enabledFlag = true;
        this.uniqueKey = uniqueKey;
        this.originalMethod = originalMethod;
        this.intervalMs = intervalMs;
        this.options = options;
        this.logger = new common_1.Logger(this.uniqueKey);
        if (!SingletonIntervalService.globalMutexMap.has(this.uniqueKey)) {
            SingletonIntervalService.globalMutexMap.set(this.uniqueKey, new async_mutex_1.Mutex());
        }
        this.mutex = SingletonIntervalService.globalMutexMap.get(this.uniqueKey);
        if (!SingletonIntervalService.intervalDefinitions.has(this.uniqueKey)) {
            SingletonIntervalService.intervalDefinitions.set(this.uniqueKey, {
                name: this.uniqueKey,
                interval: intervalMs,
            });
        }
        this.combinedConditions = this.buildConditions();
        SingletonIntervalService.lastConditionsNotMetLogTime.set(this.uniqueKey, Date.now());
    }
    async run(context, args) {
        const emitter = SingletonIntervalService.eventEmitter;
        const release = await this.preRun(emitter);
        if (!release)
            return;
        await this.executeWithTimeoutAndEvents(context, args, release, emitter);
    }
    /**
     * Dynamically register this interval via Nest’s SchedulerRegistry.
     * Requires SchedulerRegistry set via setSchedulerRegistry().
     */
    registerWithScheduler(context) {
        const reg = SingletonIntervalService.schedulerRegistry;
        if (!reg) {
            // Queue until schedulerRegistry is configured (avoid duplicates)
            if (!SingletonIntervalService.pendingRegistrations.some((r) => r.service === this)) {
                SingletonIntervalService.pendingRegistrations.push({
                    service: this,
                    context,
                });
            }
            return;
        }
        // Prevent duplicate scheduling if already registered
        if (reg.getIntervals().includes(this.uniqueKey)) {
            this.logger.warn(`Interval '${this.uniqueKey}' already registered, skipping duplicate.`);
            return;
        }
        const timer = setInterval(() => this.run(context, []), this.intervalMs);
        try {
            this.logger.log(`Registering singleton interval: ${this.uniqueKey}`);
            reg.addInterval(this.uniqueKey, timer);
        }
        catch (err) {
            this.logger.warn(`Interval '${this.uniqueKey}' already registered, skipping duplicate.`);
        }
    }
    buildConditions() {
        var _a, _b;
        const conditions = {};
        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.conditions) {
            Object.assign(conditions, this.options.conditions);
        }
        if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.microservices) {
            for (const name of this.options.microservices) {
                conditions[`Microservice ${name} available`] = async () => {
                    if (!SingletonIntervalService.isMicroserviceResponsive) {
                        this.logger.error(`[${this.uniqueKey}] No health-check provided for '${name}', treating as down.`);
                        return false;
                    }
                    try {
                        return await SingletonIntervalService.isMicroserviceResponsive(name);
                    }
                    catch (_a) {
                        this.logger.error(`[${this.uniqueKey}] Error checking microservice '${name}'.`);
                        return false;
                    }
                };
            }
        }
        return conditions;
    }
    async checkConditions() {
        const notMet = [];
        for (const [name, fn] of Object.entries(this.combinedConditions)) {
            let timeoutHandle;
            try {
                const result = await Promise.race([
                    fn().catch(() => false),
                    new Promise((_, reject) => {
                        timeoutHandle = setTimeout(() => reject(new Error(`Condition '${name}' timed out`)), SingletonIntervalService.CONDITION_TIMEOUT_MS);
                    }),
                ]);
                if (!result)
                    notMet.push(name);
            }
            catch (_a) {
                notMet.push(name);
            }
            finally {
                clearTimeout(timeoutHandle);
            }
        }
        return notMet;
    }
    logConditionsNotMet(notMet) {
        const now = Date.now();
        if (now - SingletonIntervalService.appStartTimeMs <
            SingletonIntervalService.initialSuppressMs) {
            const nonMicro = notMet.filter((n) => !n.startsWith("Microservice "));
            if (nonMicro.length) {
                this.logger.warn(`Conditions not met: [${nonMicro.join(", ")}].`);
            }
            return;
        }
        const lastLog = SingletonIntervalService.lastConditionsNotMetLogTime.get(this.uniqueKey);
        if (!SingletonIntervalService.SHOULD_THROTTLE_NOT_MET_LOGS ||
            now - lastLog > SingletonIntervalService.NOT_MET_LOG_THROTTLE_MS) {
            this.logger.warn(`Conditions not met: [${notMet.join(", ")}]. ${(0, humanize_duration_1.default)(this.intervalMs)} interval.`);
            SingletonIntervalService.lastConditionsNotMetLogTime.set(this.uniqueKey, now);
        }
    }
    async handleConditionsStage() {
        const emitter = SingletonIntervalService.eventEmitter;
        const notMet = await this.checkConditions();
        if (!notMet.length)
            return true;
        this.logConditionsNotMet(notMet);
        emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.ConditionsNotMet), { intervalName: this.uniqueKey, failedConditions: notMet });
        const unresp = notMet.filter((c) => c.startsWith("Microservice "));
        if (unresp.length) {
            emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.MicroservicesUnresponsive), { intervalName: this.uniqueKey, unresponsive: unresp });
        }
        return false;
    }
    emitInit() {
        const emitter = SingletonIntervalService.eventEmitter;
        if (!SingletonIntervalService.initEmittedFor.has(this.uniqueKey)) {
            emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.Init), { intervalName: this.uniqueKey, intervalMs: this.intervalMs });
            SingletonIntervalService.initEmittedFor.add(this.uniqueKey);
        }
    }
    handleAlreadyRunning() {
        var _a;
        if (this.mutex.isLocked()) {
            (_a = SingletonIntervalService.eventEmitter) === null || _a === void 0 ? void 0 : _a.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.AlreadyRunning), { intervalName: this.uniqueKey });
            return true;
        }
        return false;
    }
    handleDisabled() {
        const now = Date.now();
        const lastLog = SingletonIntervalService.lastInactiveLogTime.get(this.uniqueKey) || 0;
        if (now - lastLog > SingletonIntervalService.INACTIVE_LOG_THROTTLE_MS) {
            this.logger.warn(`Interval '${this.uniqueKey}' is disabled.`);
            SingletonIntervalService.lastInactiveLogTime.set(this.uniqueKey, now);
        }
    }
    async preRun(emitter) {
        this.emitInit();
        if (this.enabled) {
            if (this.handleAlreadyRunning()) {
                return undefined;
            }
            const release = await this.acquireLock();
            if (!release) {
                return undefined;
            }
            if (!(await this.handleConditionsStage())) {
                release();
                return undefined;
            }
            emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.Started), { intervalName: this.uniqueKey });
            return release;
        }
        else {
            this.handleDisabled();
            return undefined;
        }
    }
    async handleFinally() {
        var _a;
        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.finally) {
            try {
                await this.options.finally();
            }
            catch (e) {
                this.logger.error(`Error in finally handler: ${e}`);
            }
        }
    }
    async handleError(err) {
        var _a, _b;
        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.onError) {
            try {
                await this.options.onError(err);
            }
            catch (e) {
                this.logger.error(`Error in onError handler: ${e}`);
            }
        }
        (_b = SingletonIntervalService.eventEmitter) === null || _b === void 0 ? void 0 : _b.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.Error), { intervalName: this.uniqueKey, error: err });
    }
    async handleTerminate(err) {
        var _a, _b;
        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.onTerminate) {
            try {
                await this.options.onTerminate();
            }
            catch (e) {
                this.logger.error(`Error in onTerminate handler: ${e}`);
            }
        }
        (_b = SingletonIntervalService.eventEmitter) === null || _b === void 0 ? void 0 : _b.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.Terminated), { intervalName: this.uniqueKey, error: err });
    }
    async acquireLock() {
        try {
            return await this.mutex.acquire();
        }
        catch (e) {
            this.logger.error(`Failed to acquire lock: ${e}`);
            return undefined;
        }
    }
    async executeWithTimeoutAndEvents(context, args, release, emitter) {
        let timer;
        const start = Date.now();
        try {
            const timeout = new Promise((_, rej) => {
                timer = setTimeout(() => rej(new IntervalTerminated(this.uniqueKey, this.intervalMs)), SingletonIntervalService.INTERVAL_TERMINATION_FACTOR * this.intervalMs);
            });
            await Promise.race([this.originalMethod.apply(context, args), timeout]);
            emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.Success), { intervalName: this.uniqueKey });
        }
        catch (err) {
            if (err instanceof IntervalTerminated) {
                await this.handleTerminate(err);
            }
            else {
                await this.handleError(err);
            }
        }
        finally {
            clearTimeout(timer);
            release();
            const elapsed = Date.now() - start;
            if (elapsed > this.intervalMs) {
                this.logger.warn(`Long run: ${elapsed}ms`);
                emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.LongRunning), { intervalName: this.uniqueKey, elapsed });
            }
            await this.handleFinally();
            emitter === null || emitter === void 0 ? void 0 : emitter.emit(getEventName(this.uniqueKey, SingletonIntervalEvents.Finish), { intervalName: this.uniqueKey, elapsed });
        }
    }
}
exports.SingletonIntervalService = SingletonIntervalService;
/** Pending registrations until schedulerRegistry is set */
SingletonIntervalService.pendingRegistrations = [];
/** Pending decorator definitions until instances are discovered */
SingletonIntervalService.pendingDefinitions = [];
SingletonIntervalService.globalMutexMap = new Map();
SingletonIntervalService.initEmittedFor = new Set();
SingletonIntervalService.intervalDefinitions = new Map();
SingletonIntervalService.lastConditionsNotMetLogTime = new Map();
SingletonIntervalService.appStartTimeMs = Date.now();
SingletonIntervalService.initialSuppressMs = 45 * 1000;
SingletonIntervalService.lastInactiveLogTime = new Map();
SingletonIntervalService.INACTIVE_LOG_THROTTLE_MS = 45 * 1000;
SingletonIntervalService.NOT_MET_LOG_THROTTLE_MS = 60 * 1000;
SingletonIntervalService.SHOULD_THROTTLE_NOT_MET_LOGS = true;
SingletonIntervalService.CONDITION_TIMEOUT_MS = 15 * 1000;
SingletonIntervalService.INTERVAL_TERMINATION_FACTOR = 20;
exports.INTERVAL_TERMINATION_FACTOR = SingletonIntervalService.INTERVAL_TERMINATION_FACTOR;
//# sourceMappingURL=singleton-interval.service.js.map