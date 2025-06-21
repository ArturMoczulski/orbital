// intervals-registry.ts

import { Controller, Global } from "@nestjs/common";
import { IntervalsMonitorService } from "./intervals-monitor.service";
import { SingletonInterval } from "./singleton-interval.decorator";

@Global()
@Controller()
export class IntervalsMonitorController {
  constructor(
    protected readonly intervalsMonitorService: IntervalsMonitorService
  ) {}

  // @SingletonInterval(5000)
  // monitor() {
  //   this.intervalsMonitorService.printStatusReport();
  // }
}
