"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsProducerMetricNames = exports.makeJobsProducerMetricsProviders = exports.JobsProducer = exports.JobsProducerMarkProcessingOrder = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@orbital/microservices");
const singleton_interval_1 = require("@orbital/singleton-interval");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const archy_1 = __importDefault(require("archy"));
const lodash_1 = __importDefault(require("lodash"));
var JobsProducerMarkProcessingOrder;
(function (JobsProducerMarkProcessingOrder) {
    JobsProducerMarkProcessingOrder[JobsProducerMarkProcessingOrder["PRE_PRODUCE"] = 0] = "PRE_PRODUCE";
    JobsProducerMarkProcessingOrder[JobsProducerMarkProcessingOrder["POST_PRODUCE"] = 1] = "POST_PRODUCE";
})(JobsProducerMarkProcessingOrder || (exports.JobsProducerMarkProcessingOrder = JobsProducerMarkProcessingOrder = {}));
class JobsProducer {
    onPaused() {
        var _a;
        const now = Date.now();
        if (now - this.lastPausedLog > JobsProducer.PAUSED_LOG_THROTTLE_MS) {
            const micro = (_a = this.lastUnavailableMicroservice) !== null && _a !== void 0 ? _a : "dependency";
            this.logger.warn(`Microservice not available: [${micro}]. This is a frequent operation so only logging once every ${JobsProducer.PAUSED_LOG_THROTTLE_MS / 1000} seconds.`);
            this.lastPausedLog = now;
        }
        return 0;
    }
    constructor(queue, eventEmitter, produceProfileGauge, pendingItemsProfileGauge, markProcessingProfileGauge, persistProfileGauge, successCounter, failCounter, queueSizeGauge, runningConsumersGauge, schedulerRegistry) {
        this.queue = queue;
        this.eventEmitter = eventEmitter;
        this.produceProfileGauge = produceProfileGauge;
        this.pendingItemsProfileGauge = pendingItemsProfileGauge;
        this.markProcessingProfileGauge = markProcessingProfileGauge;
        this.persistProfileGauge = persistProfileGauge;
        this.successCounter = successCounter;
        this.failCounter = failCounter;
        this.queueSizeGauge = queueSizeGauge;
        this.runningConsumersGauge = runningConsumersGauge;
        this.schedulerRegistry = schedulerRegistry;
        this.logger = new common_1.Logger(JobsProducer.name);
        this.paused = false;
        this.lastPausedLog = 0;
        this.verbose = false;
        this.lastNoPendingLog = 0;
        this.scheduledKeys = new Set();
        this.logger = new common_1.Logger(this.constructor.name);
        this.queueSizeGauge = queueSizeGauge;
        this.pendingItemsProfileGauge = pendingItemsProfileGauge;
        this.markProcessingProfileGauge = markProcessingProfileGauge;
        if (this.runningConsumersGauge &&
            typeof this.runningConsumersGauge.reset === "function") {
            this.runningConsumersGauge.reset();
            this.runningConsumersGauge.set({ queue: this.queue.name }, 0);
        }
        this.scheduleIntervals();
    }
    onModuleInit() {
        this.eventEmitter.on(microservices_1.MicroserviceManagerEvents.Unavailable, ({ microservice }) => {
            if (!this.paused) {
                this.logger.warn(`Paused producer: dependency '${microservice}' unavailable`);
                this.paused = true;
                this.lastUnavailableMicroservice = microservice;
            }
        });
        this.eventEmitter.on(microservices_1.MicroserviceManagerEvents.Available, ({ microservice }) => {
            if (this.paused) {
                this.logger.log(`Resumed producer: dependency '${microservice}' available`);
                this.paused = false;
                this.lastUnavailableMicroservice = undefined;
            }
        });
    }
    microserviceDependencies() {
        return [];
    }
    scheduleIntervals() {
        const deps = this.microserviceDependencies();
        const produceIntervalService = new singleton_interval_1.SingletonIntervalService(`${this.constructor.name}.produce`, this.produce.bind(this), this.productionFrequency(), { microservices: deps });
        produceIntervalService.registerWithScheduler(this);
        const persistIntervalService = new singleton_interval_1.SingletonIntervalService(`${this.constructor.name}.persist`, this.persist.bind(this), this.persistanceFrequency(), { microservices: deps });
        persistIntervalService.registerWithScheduler(this);
    }
    heartbeat() {
        const now = Date.now();
        if (now - this.lastNoPendingLog > 20000 && !this.paused) {
            this.logger.verbose(`No pending items...`);
            this.lastNoPendingLog = now;
        }
    }
    markProcessingOrder() {
        return JobsProducerMarkProcessingOrder.POST_PRODUCE;
    }
    forbidDuplicates() {
        return false;
    }
    metricsLabels() {
        return [];
    }
    uniqueKey() {
        return "_id";
    }
    consumerConcurrency() {
        return Math.ceil(this.queueSize() / 10) || 1;
    }
    productionFrequency() {
        return 3000;
    }
    persistanceFrequency() {
        return 3000;
    }
    queueSize() {
        return 100;
    }
    async produce() {
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
            this.queueSizeGauge.set({ producer: producerLabel, queue: this.queue.name }, outstanding);
            if (outstanding >= this.queueSize()) {
                this.verbose &&
                    this.logger.debug(`produce: there are already jobs waiting or delayed (${outstanding}), skipping.`);
                return 0;
            }
            let pendingItems;
            try {
                const startPending = Date.now();
                pendingItems = await this.pendingItems();
                if (!Array.isArray(pendingItems)) {
                    throw new Error(`produce: Unexpected data of type ${pendingItems}, expected array of job data items`);
                }
                pendingItems = pendingItems.slice(0, this.queueSize());
                const durationPending = Date.now() - startPending;
                this.pendingItemsProfileGauge.set({ producer: producerLabel, queue: this.queue.name }, durationPending);
            }
            catch (err) {
                this.logger.error(`produce: error fetching pending items: ${err.message}`, err.stack);
                return 0;
            }
            if (!pendingItems || pendingItems.length === 0) {
                this.verbose && this.heartbeat();
                return 0;
            }
            if (this.forbidDuplicates()) {
                const keyField = this.uniqueKey();
                let waitingJobs;
                try {
                    waitingJobs = await this.queue.getWaiting();
                }
                catch (err) {
                    this.logger.error(`produce: error fetching waiting jobs: ${err.message}`, err.stack);
                    return 0;
                }
                const waitingKeys = new Set(waitingJobs.map((job) => job.data[keyField]).filter(Boolean));
                const existingKeys = new Set([
                    ...waitingKeys,
                    ...this.scheduledKeys,
                ]);
                const originalCount = pendingItems.length;
                pendingItems = pendingItems.filter((item) => !existingKeys.has(item[keyField]));
                const filteredCount = pendingItems.length;
                const duplicateCount = originalCount - filteredCount;
                if (duplicateCount > 0) {
                    this.logger.warn(`produce: detected ${duplicateCount} duplicate item(s), skipping them.`);
                }
                if (pendingItems.length === 0) {
                    if (this.verbose) {
                        this.logger.debug(`produce: all fetched items are duplicates, skipping.`);
                    }
                    return 0;
                }
            }
            const keyField = this.uniqueKey();
            if (this.verbose) {
                const tree = {
                    label: `Queue: ${this.queue.name} | produce`,
                    nodes: pendingItems.map((item) => ({
                        label: String(item[keyField]),
                        nodes: [],
                    })),
                };
                this.logger.log("\n" + (0, archy_1.default)(tree));
            }
            const jobName = this.jobName();
            const bulkOps = pendingItems.map((item) => {
                const keyValue = String(item[keyField]);
                return {
                    name: jobName,
                    data: item,
                    opts: { jobId: keyValue },
                };
            });
            const order = this.markProcessingOrder();
            if (order === JobsProducerMarkProcessingOrder.PRE_PRODUCE) {
                const pseudoJobs = pendingItems.map((item) => ({ data: item }));
                const startMark = Date.now();
                await this.markItemsAsProcessing(pseudoJobs);
                const durationMark = Date.now() - startMark;
                this.markProcessingProfileGauge.set({ producer: producerLabel, queue: this.queue.name }, durationMark);
            }
            const jobs = await this.queue.addBulk(bulkOps);
            if (order === JobsProducerMarkProcessingOrder.POST_PRODUCE) {
                const startMark = Date.now();
                await this.markItemsAsProcessing(jobs);
                const durationMark = Date.now() - startMark;
                this.markProcessingProfileGauge.set({ producer: producerLabel, queue: this.queue.name }, durationMark);
            }
            this.logger.log(`produce: enqueued ${jobs.length}/${pendingItems.length} jobs to queue "${jobName}".`);
            if (this.forbidDuplicates()) {
                const keyField = this.uniqueKey();
                for (const job of jobs) {
                    const keyValue = job.data[keyField];
                    if (keyValue) {
                        this.scheduledKeys.add(keyValue);
                    }
                    else {
                        this.logger.error(`produce: failed to record scheduled key: job.data missing uniqueKey field "${String(keyField)}".`);
                    }
                }
            }
            return jobs.length;
        }
        finally {
            const durationMs = Date.now() - startProduce;
            this.produceProfileGauge.set({ producer: producerLabel, queue: this.queue.name }, durationMs);
        }
    }
    successMessage(summary) {
        this.logger.log(`persisted results for ${summary} successful job(s)`);
    }
    failMessage(summary, failed) {
        if (this.verbose) {
            const keyField = this.uniqueKey();
            const tree = {
                label: `${failed.length} failed jobs`,
                nodes: failed.map((job) => {
                    const uniqueId = String(job.data[keyField]);
                    return {
                        label: `\u001b[31m${this.jobName()} ${uniqueId}: ${job.failedReason || "No error message"}\u001b[0m`,
                        nodes: job.stacktrace && job.stacktrace.length > 0 ? job.stacktrace : [],
                    };
                }),
            };
            this.logger.error("Failed jobs:\n" + (0, archy_1.default)(tree));
        }
        else {
            this.logger.log(`persisted failures for ${summary} failed jobs`);
        }
    }
    async persist() {
        if (this.paused) {
            return;
        }
        const producerLabel = this.constructor.name;
        const startPersist = Date.now();
        try {
            const batchSize = this.queueSize() * 2;
            const completedJobs = await this.queue.getJobs(["completed"], 0, batchSize - 1);
            if (completedJobs.length > 0) {
                try {
                    const summary = await this.onSuccess(completedJobs);
                    this.successCounter.inc({ producer: producerLabel, queue: this.queue.name }, Number(summary));
                    this.trackMetricsByFields(this.successCounter, completedJobs, producerLabel);
                    this.verbose && this.successMessage(summary);
                    await this.queue.clean(0, "completed", completedJobs.length);
                }
                catch (err) {
                    this.logger.error(`Error in onSuccess: ${err.message}`, err.stack);
                }
            }
            const failedJobs = await this.queue.getJobs(["failed"], 0, batchSize - 1);
            if (failedJobs.length > 0) {
                try {
                    const summary = await this.onFail(failedJobs);
                    this.failCounter.inc({ producer: producerLabel, queue: this.queue.name }, Number(summary));
                    this.trackMetricsByFields(this.failCounter, failedJobs, producerLabel);
                    this.failMessage(summary, failedJobs);
                    await this.queue.clean(0, "failed", failedJobs.length);
                }
                catch (err) {
                    this.logger.error(`Error in onFail: ${err.message}`, err.stack);
                }
            }
        }
        finally {
            const durationPersist = Date.now() - startPersist;
            this.persistProfileGauge.set({ producer: producerLabel, queue: this.queue.name }, durationPersist);
        }
    }
    trackMetricsByFields(metric, jobs, producerLabel) {
        const extraFields = this.metricsLabels();
        if (extraFields.length === 0) {
            return;
        }
        const sanitizedFields = extraFields.map((path) => path.replace(/\./g, "_"));
        const counts = {};
        sanitizedFields.forEach((labelName) => {
            counts[labelName] = new Map();
        });
        for (const job of jobs) {
            extraFields.forEach((path, idx) => {
                const labelName = sanitizedFields[idx];
                const rawValue = lodash_1.default.get(job.data, path);
                const value = rawValue !== undefined ? String(rawValue) : "";
                const fieldMap = counts[labelName];
                fieldMap.set(value, (fieldMap.get(value) || 0) + 1);
            });
        }
        for (const labelName of sanitizedFields) {
            const fieldMap = counts[labelName];
            for (const [value, count] of fieldMap) {
                const labels = {
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
            const workerInfos = await this.queue.getWorkers();
            const consumerCount = Array.isArray(workerInfos) ? workerInfos.length : 0;
            this.runningConsumersGauge.set({ queue: this.queue.name }, consumerCount);
        }
        catch (err) {
            this.logger.warn(`Error updating consumer count: ${err.message}`);
        }
    }
}
exports.JobsProducer = JobsProducer;
JobsProducer.PAUSED_LOG_THROTTLE_MS = 30000;
const makeJobsProducerMetricsProviders = (extraLabelNames = []) => {
    const baseLabels = ["producer", "queue"];
    const sanitizedExtras = extraLabelNames.map((path) => path.replace(/\./g, "_"));
    const allLabels = Array.from(new Set([...baseLabels, ...sanitizedExtras]));
    return [
        (0, nestjs_prometheus_1.makeGaugeProvider)({
            name: JobsProducerMetricNames.PRODUCE_PROFILE,
            help: "Duration of JobsProducer.produce() in milliseconds",
            labelNames: baseLabels,
        }),
        (0, nestjs_prometheus_1.makeGaugeProvider)({
            name: JobsProducerMetricNames.PENDING_ITEMS_PROFILE,
            help: "Duration of pendingItems() in milliseconds",
            labelNames: baseLabels,
        }),
        (0, nestjs_prometheus_1.makeGaugeProvider)({
            name: JobsProducerMetricNames.MARK_PROCESSING_PROFILE,
            help: "Duration of markItemsAsProcessing() in milliseconds",
            labelNames: baseLabels,
        }),
        (0, nestjs_prometheus_1.makeGaugeProvider)({
            name: JobsProducerMetricNames.PERSIST_PROFILE,
            help: "Duration of persist() in milliseconds",
            labelNames: baseLabels,
        }),
        (0, nestjs_prometheus_1.makeGaugeProvider)({
            name: JobsProducerMetricNames.QUEUE_SIZE,
            help: "Number of outstanding jobs in the queue (waiting + delayed)",
            labelNames: baseLabels,
        }),
        (0, nestjs_prometheus_1.makeCounterProvider)({
            name: JobsProducerMetricNames.PERSISTED_SUCCESS_TOTAL,
            help: "Number of jobs successfully persisted by persist()",
            labelNames: allLabels,
        }),
        (0, nestjs_prometheus_1.makeCounterProvider)({
            name: JobsProducerMetricNames.PERSISTED_FAIL_TOTAL,
            help: "Number of jobs failed persisted by persist()",
            labelNames: allLabels,
        }),
        (0, nestjs_prometheus_1.makeGaugeProvider)({
            name: JobsProducerMetricNames.RUNNING_CONSUMERS,
            help: "Number of JobsQueueConsumer instances currently running",
            labelNames: ["queue"],
        }),
    ];
};
exports.makeJobsProducerMetricsProviders = makeJobsProducerMetricsProviders;
var JobsProducerMetricNames;
(function (JobsProducerMetricNames) {
    JobsProducerMetricNames["PRODUCE_PROFILE"] = "jobs_queue_producer_produce_profile";
    JobsProducerMetricNames["PENDING_ITEMS_PROFILE"] = "jobs_queue_producer_pending_items_profile";
    JobsProducerMetricNames["MARK_PROCESSING_PROFILE"] = "jobs_queue_producer_mark_processing_profile";
    JobsProducerMetricNames["PERSIST_PROFILE"] = "jobs_queue_producer_persist_profile";
    JobsProducerMetricNames["QUEUE_SIZE"] = "jobs_queue_producer_queue_size";
    JobsProducerMetricNames["PERSISTED_SUCCESS_TOTAL"] = "jobs_queue_producer_jobs_persisted_success_total";
    JobsProducerMetricNames["PERSISTED_FAIL_TOTAL"] = "jobs_queue_producer_jobs_persisted_fail_total";
    JobsProducerMetricNames["RUNNING_CONSUMERS"] = "jobs_queue_consumer_running_consumers";
})(JobsProducerMetricNames || (exports.JobsProducerMetricNames = JobsProducerMetricNames = {}));
//# sourceMappingURL=jobs-producer.js.map