"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusMonitorModule = void 0;
// prometheus-monitor.module.ts
const common_1 = require("@nestjs/common");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const prometheus_monitor_service_1 = require("./prometheus-monitor.service");
const prometheus_monitor_controller_1 = require("./prometheus-monitor.controller");
const intervals_registry_module_1 = require("../intervals-registry.module");
let PrometheusMonitorModule = class PrometheusMonitorModule {
};
exports.PrometheusMonitorModule = PrometheusMonitorModule;
exports.PrometheusMonitorModule = PrometheusMonitorModule = __decorate([
    (0, common_1.Module)({
        imports: [intervals_registry_module_1.IntervalsRegistryModule],
        controllers: [prometheus_monitor_controller_1.PrometheusMonitorController],
        providers: [
            prometheus_monitor_service_1.PrometheusMonitorService,
            // Declare your metrics
            (0, nestjs_prometheus_1.makeGaugeProvider)({
                name: "interval_last_run_duration_ms",
                help: "Tracks the most recent run time (ms) for each interval",
                labelNames: ["interval_name"],
            }),
            (0, nestjs_prometheus_1.makeCounterProvider)({
                name: "interval_runs_total",
                help: "Counts how many times each interval has run",
                labelNames: ["interval_name"],
            }),
            (0, nestjs_prometheus_1.makeGaugeProvider)({
                name: "interval_state_code",
                help: "Represents the interval state as a numeric code (e.g. RUNNING=2, ERROR=7)",
                labelNames: ["interval_name"],
            }),
        ],
        exports: [prometheus_monitor_service_1.PrometheusMonitorService],
    })
], PrometheusMonitorModule);
//# sourceMappingURL=prometheus-monitor.module.js.map