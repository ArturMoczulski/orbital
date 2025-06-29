"use strict";
// intervals-registry.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntervalsMonitorController = void 0;
const common_1 = require("@nestjs/common");
const intervals_monitor_service_1 = require("./intervals-monitor.service");
let IntervalsMonitorController = class IntervalsMonitorController {
    constructor(intervalsMonitorService) {
        this.intervalsMonitorService = intervalsMonitorService;
    }
};
exports.IntervalsMonitorController = IntervalsMonitorController;
exports.IntervalsMonitorController = IntervalsMonitorController = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [intervals_monitor_service_1.IntervalsMonitorService])
], IntervalsMonitorController);
//# sourceMappingURL=intervals-monitor.controller.js.map