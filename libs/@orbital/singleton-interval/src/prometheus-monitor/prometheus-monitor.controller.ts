import { Controller, Global } from "@nestjs/common";
import { PrometheusMonitorService } from "./prometheus-monitor.service";
import { SingletonInterval } from "../singleton-interval.decorator";

@Global()
@Controller()
export class PrometheusMonitorController {
  constructor(private readonly monitorService: PrometheusMonitorService) {}

  @SingletonInterval(5000)
  handleUpdateMetrics() {
    this.monitorService.updateIntervalMetrics();
  }
}
