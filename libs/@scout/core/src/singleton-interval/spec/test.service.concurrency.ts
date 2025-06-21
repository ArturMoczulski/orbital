// test.service.concurrency.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class ConcurrencyTestService {
  private runCount = 0;

  @SingletonInterval(1000)
  async doWork() {
    this.runCount++;
    // Simulate a long-running task ~ 1.5s
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  getRunCount() {
    return this.runCount;
  }
}
