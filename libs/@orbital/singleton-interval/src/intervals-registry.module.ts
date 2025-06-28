// intervals-registry.module.ts
import { Global, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { IntervalsRegistryService } from "./intervals-registry.service";
import { IntervalsMonitorController } from "./intervals-monitor.controller";
import { IntervalsMonitorService } from "./intervals-monitor.service";
@Global()
@Module({
  imports: [EventEmitterModule, ScheduleModule.forRoot(), DiscoveryModule],
  controllers: [IntervalsMonitorController],
  providers: [IntervalsRegistryService, IntervalsMonitorService],
  exports: [IntervalsRegistryService, IntervalsMonitorService],
})
export class IntervalsRegistryModule {}
