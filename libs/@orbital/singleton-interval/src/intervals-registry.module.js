"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntervalsRegistryModule = void 0;
// intervals-registry.module.ts
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const intervals_registry_service_1 = require("./intervals-registry.service");
const intervals_monitor_controller_1 = require("./intervals-monitor.controller");
const intervals_monitor_service_1 = require("./intervals-monitor.service");
let IntervalsRegistryModule = class IntervalsRegistryModule {
};
exports.IntervalsRegistryModule = IntervalsRegistryModule;
exports.IntervalsRegistryModule = IntervalsRegistryModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [event_emitter_1.EventEmitterModule, schedule_1.ScheduleModule.forRoot(), core_1.DiscoveryModule],
        controllers: [intervals_monitor_controller_1.IntervalsMonitorController],
        providers: [intervals_registry_service_1.IntervalsRegistryService, intervals_monitor_service_1.IntervalsMonitorService],
        exports: [intervals_registry_service_1.IntervalsRegistryService, intervals_monitor_service_1.IntervalsMonitorService],
    })
], IntervalsRegistryModule);
//# sourceMappingURL=intervals-registry.module.js.map