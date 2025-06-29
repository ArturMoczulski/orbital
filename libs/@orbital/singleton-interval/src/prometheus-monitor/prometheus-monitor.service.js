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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PrometheusMonitorService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusMonitorService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const prom_client_1 = require("prom-client");
const intervals_registry_service_1 = require("../intervals-registry.service");
const INTERVAL_STATE_CODE = {
    INIT: 0,
    LATE: 1,
    RUNNING: 2,
    SLOW: 3,
    JAMMED: 4,
    HEALTHY: 5,
    STOPPED: 6,
    ERROR: 7,
    CONDITIONS_NOT_MET: 8,
    MICROSERVICES_UNAVAILABLE: 9,
};
let PrometheusMonitorService = PrometheusMonitorService_1 = class PrometheusMonitorService {
    constructor(intervalsRegistry, lastRunDurationGauge, runsCounter, stateGauge) {
        this.intervalsRegistry = intervalsRegistry;
        this.lastRunDurationGauge = lastRunDurationGauge;
        this.runsCounter = runsCounter;
        this.stateGauge = stateGauge;
        this.logger = new common_1.Logger(PrometheusMonitorService_1.name);
    }
    updateIntervalMetrics() {
        var _a;
        // Get the latest snapshot from your registry
        const report = this.intervalsRegistry.getStatusReport();
        for (const item of report) {
            const { key: intervalName, status, lastDuration } = item;
            // 1) Update the gauge with the last run duration (ms).
            // Prometheus will store this as a time-series.
            this.lastRunDurationGauge.set({ interval_name: intervalName }, lastDuration);
            // 2) (Optional) If a new run just occurred, increment the counter
            // so you can also see total runs over time (if you like).
            if (lastDuration > 0) {
                this.runsCounter.inc({ interval_name: intervalName });
            }
            // 3) (Optional) Store a numeric code for the current state
            const code = (_a = INTERVAL_STATE_CODE[status]) !== null && _a !== void 0 ? _a : -1;
            this.stateGauge.set({ interval_name: intervalName }, code);
        }
    }
};
exports.PrometheusMonitorService = PrometheusMonitorService;
exports.PrometheusMonitorService = PrometheusMonitorService = PrometheusMonitorService_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Injectable)(),
    __param(1, (0, nestjs_prometheus_1.InjectMetric)("interval_last_run_duration_ms")),
    __param(2, (0, nestjs_prometheus_1.InjectMetric)("interval_runs_total")),
    __param(3, (0, nestjs_prometheus_1.InjectMetric)("interval_state_code")),
    __metadata("design:paramtypes", [intervals_registry_service_1.IntervalsRegistryService, typeof (_a = typeof prom_client_1.Gauge !== "undefined" && prom_client_1.Gauge) === "function" ? _a : Object, typeof (_b = typeof prom_client_1.Counter !== "undefined" && prom_client_1.Counter) === "function" ? _b : Object, typeof (_c = typeof prom_client_1.Gauge !== "undefined" && prom_client_1.Gauge) === "function" ? _c : Object])
], PrometheusMonitorService);
//# sourceMappingURL=prometheus-monitor.service.js.map