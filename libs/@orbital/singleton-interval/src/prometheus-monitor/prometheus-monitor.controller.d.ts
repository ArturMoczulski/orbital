import { PrometheusMonitorService } from "./prometheus-monitor.service";
export declare class PrometheusMonitorController {
    private readonly monitorService;
    constructor(monitorService: PrometheusMonitorService);
    handleUpdateMetrics(): void;
}
