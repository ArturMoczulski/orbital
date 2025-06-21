// test.service.conditions.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class ConditionsTestService {
  private executionCount = 0;
  private lastSkippedReason: string[] | undefined;

  @SingletonInterval(1000, {
    conditions: {
      alwaysTrue: ConditionsTestService.alwaysTrueCondition,
      random50Percent: ConditionsTestService.random50PercentCondition,
    },
    onError: ConditionsTestService.handleError,
  })
  async conditionalMethod() {
    this.incrementExecutionCount();
    await this.shortTask();
  }

  protected static async alwaysTrueCondition(): Promise<boolean> {
    return true;
  }

  protected static async random50PercentCondition(): Promise<boolean> {
    return Math.random() > 0.5;
  }

  protected static async handleError(err: Error): Promise<void> {
    console.log("[ConditionsTestService] onError called:", err.message);
  }

  protected incrementExecutionCount(): void {
    this.executionCount++;
  }

  protected async shortTask(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  getExecutionCount(): number {
    return this.executionCount;
  }
}
