"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var IntervalsMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntervalsMonitorService = void 0;
const common_1 = require("@nestjs/common");
const humanize_duration_1 = __importDefault(require("humanize-duration"));
const intervals_registry_service_1 = require("./intervals-registry.service");
const Table = require("cli-table3");
let IntervalsMonitorService = IntervalsMonitorService_1 = class IntervalsMonitorService {
    constructor(intervalsRegistry) {
        this.intervalsRegistry = intervalsRegistry;
        this.logger = new common_1.Logger(IntervalsMonitorService_1.name);
    }
    /**
     * Build a CLI Table of the current intervals' status.
     *
     */
    table() {
        const report = this.intervalsRegistry.getStatusReport();
        if (report.length === 0) {
            return undefined;
        }
        // Create the table with a header row
        const table = new Table({
            head: ["Name", "Interval", "Status", "Profile"],
            style: {
                head: ["green"], // header text color
                border: ["yellow"], // border color
            },
        });
        // Populate rows
        for (const item of report) {
            // Look up the record to get its configured `intervalMs`
            const record = this.intervalsRegistry.getIntervalRecord(item.key);
            const intervalMs = record ? record.intervalMs : 0;
            const intervalText = this.humanizeDuration(intervalMs);
            const durationText = this.humanizeDuration(item.lastDuration);
            const statusEmoji = this.stateToEmoji(item.status);
            table.push([
                item.key, // e.g. "MyService.myMethod"
                intervalText, // e.g. "1s" or "500ms"
                statusEmoji, // e.g. "🔁" for RUNNING
                durationText, // lastDuration as e.g. "3s"
            ]);
        }
        return table;
    }
    /**
     * Print the table to the logger.
     */
    printStatusReport() {
        const tbl = this.table();
        if (tbl) {
            this.logger.log("\n" + tbl.toString() + "\n");
        }
        else {
            this.logger.log("No intervals found.");
        }
    }
    /**
     * Convert milliseconds into a short human-readable string (e.g. "3s", "500ms").
     */
    humanizeDuration(milliseconds) {
        return (0, humanize_duration_1.default)(milliseconds, {
            units: ["m", "s", "ms"],
        });
    }
    /**
     * Map an IntervalState to an emoji or short string.
     */
    stateToEmoji(state) {
        switch (state) {
            case intervals_registry_service_1.IntervalState.RUNNING:
                return "🔁";
            case intervals_registry_service_1.IntervalState.HEALTHY:
                return "✅";
            case intervals_registry_service_1.IntervalState.STOPPED:
                return "🛑";
            case intervals_registry_service_1.IntervalState.LATE:
                return "⏰";
            case intervals_registry_service_1.IntervalState.SLOW:
                return "🐌";
            case intervals_registry_service_1.IntervalState.ERROR:
                return "❌";
            case intervals_registry_service_1.IntervalState.JAMMED:
                return "🚧";
            case intervals_registry_service_1.IntervalState.INIT:
                return "🆕";
            case intervals_registry_service_1.IntervalState.CONDITIONS_NOT_MET:
                return "🚫";
            case intervals_registry_service_1.IntervalState.MICROSERVICES_UNAVAILABLE:
                return "🔌";
            default:
                return state;
        }
    }
};
exports.IntervalsMonitorService = IntervalsMonitorService;
exports.IntervalsMonitorService = IntervalsMonitorService = IntervalsMonitorService_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [intervals_registry_service_1.IntervalsRegistryService])
], IntervalsMonitorService);
//# sourceMappingURL=intervals-monitor.service.js.map