// conditions-always-fail.service.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class ConditionsFailService {
  private executionCount = 0;

  @SingletonInterval(1000, {
    conditions: {
      alwaysFalse: async () => false, // <-- forces a fail
    },
  })
  async methodThatShouldNeverRun() {
    this.executionCount++;
  }

  getExecutionCount() {
    return this.executionCount;
  }
}
