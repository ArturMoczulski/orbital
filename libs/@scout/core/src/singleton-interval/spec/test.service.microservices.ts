// test.service.microservices.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class MicroservicesTestService {
  private executionCount = 0;

  @SingletonInterval(1000, {
    // for demonstration, we say these microservices must be up
    microservices: ["UserService", "PaymentService"],
  })
  async doMicroserviceDependentWork() {
    this.executionCount++;
    await new Promise((r) => setTimeout(r, 200));
  }

  getExecutionCount() {
    return this.executionCount;
  }
}
