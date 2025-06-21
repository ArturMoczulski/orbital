// profiler-monitor.service.ts
import { Global, Injectable, Logger } from '@nestjs/common';
import * as cliTable3 from 'cli-table3';
import { ProfilerNode, ProfilerService } from './profiler.service'; // or from a shared types file
import { OnEvent } from '@nestjs/event-emitter';

export type ProfilerMonitorFilters = {
  milliseconds?: number;
  percentage?: number;
};

@Global()
@Injectable()
export class ProfilerMonitorService {
  private readonly logger = new Logger(ProfilerMonitorService.name);

  static filters: ProfilerMonitorFilters;

  @OnEvent(`ProfilerService.**.profile`, { async: true })
  handleProfile(payload: { partName: string; data: ProfilerNode }) {
    this.printTable(payload.data, ProfilerMonitorService.filters);
  }

  public printTree(root: ProfilerNode): void {
    this.logger.log('--- Profiler Tree ---');
    this.printNodeRecursive(root, 'root', 0);
  }

  private printNodeRecursive(
    node: ProfilerNode,
    nodeName: string,
    depth: number,
  ): void {
    const indent = '  '.repeat(depth);
    this.logger.log(`${indent}${nodeName}: ${node.profile.toFixed(2)}ms`);

    const childNames = Object.keys(node.parts).sort();
    for (const childName of childNames) {
      this.printNodeRecursive(node.parts[childName], childName, depth + 1);
    }
  }

  public printTable(
    root: ProfilerNode,
    filter?: ProfilerMonitorFilters,
  ): void {
    // Add "Calls" column in the head
    const table = new cliTable3({
      head: ['Method', 'Calls', 'Time (ms)', '% of Total'],
      // Adjust colWidths as you see fit
      colWidths: [100, 10, 15, 12],
      wordWrap: false,
    });

    // 1) Get all top-level children
    const rootChildren = Object.keys(root.parts).sort();

    // 2) Total time of all top-level children
    const totalTime = rootChildren.reduce((acc, childName) => {
      return acc + root.parts[childName].profile;
    }, 0);

    // The same threshold logic as before
    const shouldSkip = (node: ProfilerNode) => {
      if (!filter) return false;
      const pctOfTotal = totalTime > 0 ? (node.profile / totalTime) * 100 : 0;

      if (filter.milliseconds && node.profile < filter.milliseconds) {
        return true;
      }
      if (filter.percentage && pctOfTotal < filter.percentage) {
        return true;
      }
      return false;
    };

    // Recursively print child nodes (no "other" at this recursion level)
    const pushRowsNoOther = (
      node: ProfilerNode,
      nodeName: string,
      depth: number,
    ) => {
      if (shouldSkip(node)) {
        return;
      }
      const indent = '  '.repeat(depth);
      const pctOfTotal = totalTime > 0
        ? ((node.profile / totalTime) * 100).toFixed(2)
        : '0.00';

      table.push([
        `${indent}${nodeName}`,
        node.callCount.toString(),       // <-- Display callCount
        node.profile.toFixed(2),
        `${pctOfTotal}%`,
      ]);

      const childNames = Object.keys(node.parts).sort();
      let childrenTimeSum = 0;
      for (const cName of childNames) {
        childrenTimeSum += node.parts[cName].profile;
      }

      // Recurse
      for (const cName of childNames) {
        pushRowsNoOther(node.parts[cName], cName, depth + 1);
      }

      // (other) leftover: only if this node actually has children
      if (childNames.length > 0) {
        const otherTime = node.profile - childrenTimeSum;
        if (otherTime > 0) {
          const otherPct = totalTime > 0 ? (otherTime / totalTime) * 100 : 0;
          // For the leftover row, calls are unknown; we can just show "-"
          if (
            !(filter?.milliseconds && otherTime < filter.milliseconds) &&
            !(filter?.percentage && otherPct < filter.percentage)
          ) {
            table.push([
              `${indent}(other)`,
              '-',  // No distinct calls for leftover
              otherTime.toFixed(2),
              `${otherPct.toFixed(2)}%`,
            ]);
          }
        }
      }
    };

    // 3) For each top-level child
    for (const childName of rootChildren) {
      const node = root.parts[childName];
      if (shouldSkip(node)) {
        continue;
      }
      const pctOfTotal = totalTime > 0
        ? ((node.profile / totalTime) * 100).toFixed(2)
        : '0.00';

      // Print the top-level node
      table.push([
        childName,
        node.callCount.toString(),       // <-- Display callCount
        node.profile.toFixed(2),
        `${pctOfTotal}%`,
      ]);

      // Sum up children
      const childNames = Object.keys(node.parts).sort();
      let childrenTimeSum = 0;
      for (const cName of childNames) {
        childrenTimeSum += node.parts[cName].profile;
      }

      // Print children
      for (const cName of childNames) {
        pushRowsNoOther(node.parts[cName], cName, 1);
      }

      // Print leftover, if any
      if (childNames.length > 0) {
        const otherTime = node.profile - childrenTimeSum;
        if (otherTime > 0) {
          const otherPct = totalTime > 0 ? (otherTime / totalTime) * 100 : 0;
          if (
            !(filter?.milliseconds && otherTime < filter.milliseconds) &&
            !(filter?.percentage && otherPct < filter.percentage)
          ) {
            table.push([
              '  (other)',
              '-',
              otherTime.toFixed(2),
              `${otherPct.toFixed(2)}%`,
            ]);
          }
        }
      }
    }

    // 4) Finally, log the table
    this.logger.log('\n' + table.toString());
  }
}