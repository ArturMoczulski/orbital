// test.service.error.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class ErrorTestService {
  private runCount = 0;
  private lastError: Error | null = null;

  @SingletonInterval(1000, {
    onError: async (err) => {
      // We can do side effects, e.g., store the error
      console.log("[ErrorTestService] onError invoked:", err.message);
    },
  })
  async throwErrorMethod() {
    this.runCount++;
    throw new Error("Simulated Error");
  }

  getRunCount() {
    return this.runCount;
  }
}
