import { IntervalsRegistryService } from "../intervals-registry.service";
export declare class PrometheusMonitorService {
    private readonly intervalsRegistry;
    private readonly lastRunDurationGauge;
    private readonly runsCounter;
    private readonly stateGauge;
    private readonly logger;
    constructor(intervalsRegistry: IntervalsRegistryService, lastRunDurationGauge: Gauge, runsCounter: Counter, stateGauge: Gauge);
    updateIntervalMetrics(): void;
}
