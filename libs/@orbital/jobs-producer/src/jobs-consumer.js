"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJobsConsumerMetricsProviders = exports.JobsConsumerMetricNames = exports.JobsQueueConsumer = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@orbital/microservices");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
class JobsQueueConsumer {
    constructor(queue, consumeProfileGauge, eventEmitter) {
        this.queue = queue;
        this.consumeProfileGauge = consumeProfileGauge;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(this.constructor.name);
        this.paused = false;
        this.unavailableDeps = new Set();
    }
    onModuleInit() {
        const deps = this.microserviceDependencies();
        if (!deps.length)
            return;
        this.registerDependencyListeners(deps);
    }
    registerDependencyListeners(deps) {
        this.eventEmitter.on(microservices_1.MicroserviceManagerEvents.Unavailable, (payload) => this.dependencyUnavailableHandler(payload, deps));
        this.eventEmitter.on(microservices_1.MicroserviceManagerEvents.Available, (payload) => this.dependencyAvailableHandler(payload, deps));
    }
    dependencyUnavailableHandler({ microservice }, deps) {
        if (deps.includes(microservice)) {
            this.unavailableDeps.add(microservice);
            if (!this.paused) {
                this.queue.pause();
                this.logger.warn(`Microservices '${microservice}' unavailable`);
                this.paused = true;
            }
        }
    }
    dependencyAvailableHandler({ microservice }, deps) {
        if (deps.includes(microservice)) {
            this.unavailableDeps.delete(microservice);
            if (this.paused && this.unavailableDeps.size === 0) {
                this.queue.resume();
                this.logger.log(`Resumed consumer: all microservices '${microservice}' available`);
                this.paused = false;
            }
        }
    }
    microserviceDependencies() {
        return [];
    }
    async process(job) {
        const start = Date.now();
        try {
            return await this.consume(job);
        }
        finally {
            const duration = Date.now() - start;
            this.consumeProfileGauge.set({ queue: this.queue.name }, duration);
        }
    }
}
exports.JobsQueueConsumer = JobsQueueConsumer;
var JobsConsumerMetricNames;
(function (JobsConsumerMetricNames) {
    JobsConsumerMetricNames["CONSUME_PROFILE"] = "jobs_queue_consumer_consume_profile";
})(JobsConsumerMetricNames || (exports.JobsConsumerMetricNames = JobsConsumerMetricNames = {}));
const makeJobsConsumerMetricsProviders = () => (0, nestjs_prometheus_1.makeGaugeProvider)({
    name: JobsConsumerMetricNames.CONSUME_PROFILE,
    help: "Duration of process() in milliseconds",
    labelNames: ["queue"],
});
exports.makeJobsConsumerMetricsProviders = makeJobsConsumerMetricsProviders;
//# sourceMappingURL=jobs-consumer.js.map