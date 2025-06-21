import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class NormalFlowTestService {
  private runCount = 0;
  private delayMs = 0;

  /**
   * We'll configure this so that the method can run:
   * - Quickly (e.g., 300ms) => to see Started, Success, Finish (but not LongRunning)
   * - Slightly over the interval (e.g., 1500ms for a 1s interval) => to see LongRunning
   */
  @SingletonInterval(1000)
  async normalFlowMethod() {
    this.runCount++;
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }

  public setDelay(ms: number) {
    this.delayMs = ms;
  }

  getRunCount() {
    return this.runCount;
  }
}
