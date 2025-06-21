import { Global, Injectable, Logger } from "@nestjs/common";
import {
  IntervalsRegistryService,
  IntervalState,
} from "./intervals-registry.service";
import * as Table from "cli-table3";
import {} from "cli-table3";
import humanizeDuration from "humanize-duration";

@Global()
@Injectable()
export class IntervalsMonitorService {
  private readonly logger = new Logger(IntervalsMonitorService.name);

  constructor(private readonly intervalsRegistry: IntervalsRegistryService) {}

  /**
   * Build a CLI Table of the current intervals' status.
   *
   */
  public table() {
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
  public printStatusReport(): void {
    const tbl = this.table();
    if (tbl) {
      this.logger.log("\n" + tbl.toString() + "\n");
    } else {
      this.logger.log("No intervals found.");
    }
  }

  /**
   * Convert milliseconds into a short human-readable string (e.g. "3s", "500ms").
   */
  private humanizeDuration(milliseconds: number): string {
    return humanizeDuration(milliseconds, {
      units: ["m", "s", "ms"],
    });
  }

  /**
   * Map an IntervalState to an emoji or short string.
   */
  private stateToEmoji(state: IntervalState): string {
    switch (state) {
      case IntervalState.RUNNING:
        return "🔁";
      case IntervalState.HEALTHY:
        return "✅";
      case IntervalState.STOPPED:
        return "🛑";
      case IntervalState.LATE:
        return "⏰";
      case IntervalState.SLOW:
        return "🐌";
      case IntervalState.ERROR:
        return "❌";
      case IntervalState.JAMMED:
        return "🚧";
      case IntervalState.INIT:
        return "🆕";
      case IntervalState.CONDITIONS_NOT_MET:
        return "🚫";
      case IntervalState.MICROSERVICES_UNAVAILABLE:
        return "🔌";
      default:
        return state;
    }
  }
}
