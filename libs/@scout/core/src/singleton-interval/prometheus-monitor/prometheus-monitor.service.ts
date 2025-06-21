import { Global, Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Gauge } from "prom-client";
import {
  IntervalsRegistryService,
  IntervalState,
  IntervalStatus,
} from "../intervals-registry.service";

const INTERVAL_STATE_CODE: Record<IntervalState, number> = {
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

@Global()
@Injectable()
export class PrometheusMonitorService {
  private readonly logger = new Logger(PrometheusMonitorService.name);

  constructor(
    private readonly intervalsRegistry: IntervalsRegistryService,

    // A gauge for the "last run duration" in ms
    @InjectMetric("interval_last_run_duration_ms")
    private readonly lastRunDurationGauge: Gauge<"interval_name">,

    // (Optional) a counter for the total runs of each interval
    @InjectMetric("interval_runs_total")
    private readonly runsCounter: Counter<"interval_name">,

    // (Optional) a gauge for numeric state code
    @InjectMetric("interval_state_code")
    private readonly stateGauge: Gauge<"interval_name">
  ) {}

  public updateIntervalMetrics(): void {
    // Get the latest snapshot from your registry
    const report: IntervalStatus[] = this.intervalsRegistry.getStatusReport();

    for (const item of report) {
      const { key: intervalName, status, lastDuration } = item;

      // 1) Update the gauge with the last run duration (ms).
      // Prometheus will store this as a time-series.
      this.lastRunDurationGauge.set(
        { interval_name: intervalName },
        lastDuration
      );

      // 2) (Optional) If a new run just occurred, increment the counter
      // so you can also see total runs over time (if you like).
      if (lastDuration > 0) {
        this.runsCounter.inc({ interval_name: intervalName });
      }

      // 3) (Optional) Store a numeric code for the current state
      const code = INTERVAL_STATE_CODE[status] ?? -1;
      this.stateGauge.set({ interval_name: intervalName }, code);
    }
  }
}
