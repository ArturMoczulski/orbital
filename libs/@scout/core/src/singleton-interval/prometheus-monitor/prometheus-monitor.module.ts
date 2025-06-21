// prometheus-monitor.module.ts
import { Module } from "@nestjs/common";
import {
  PrometheusModule,
  makeGaugeProvider,
  makeCounterProvider,
} from "@willsoto/nestjs-prometheus";
import { PrometheusMonitorService } from "./prometheus-monitor.service";
import { PrometheusMonitorController } from "./prometheus-monitor.controller";
import { IntervalsRegistryModule } from "../intervals-registry.module";

@Module({
  imports: [IntervalsRegistryModule],
  controllers: [PrometheusMonitorController],
  providers: [
    PrometheusMonitorService,
    // Declare your metrics
    makeGaugeProvider({
      name: "interval_last_run_duration_ms",
      help: "Tracks the most recent run time (ms) for each interval",
      labelNames: ["interval_name"],
    }),
    makeCounterProvider({
      name: "interval_runs_total",
      help: "Counts how many times each interval has run",
      labelNames: ["interval_name"],
    }),
    makeGaugeProvider({
      name: "interval_state_code",
      help: "Represents the interval state as a numeric code (e.g. RUNNING=2, ERROR=7)",
      labelNames: ["interval_name"],
    }),
  ],
  exports: [PrometheusMonitorService],
})
export class PrometheusMonitorModule {}
