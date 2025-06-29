// test.service.callbacks.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class CallbacksTestService {
  private onTerminateCalled = false;
  private onErrorCalled = false;

  @SingletonInterval(500, {
    onTerminate: async function (this: CallbacksTestService) {
      console.log("[CallbacksTestService] onTerminate called!");
      // Access the service instance properties directly
      const service = this as unknown as CallbacksTestService;
      service.setOnTerminateCalled(true);
    },
    onError: async function (this: CallbacksTestService, err: Error) {
      console.log("[CallbacksTestService] onError called!", err.message);
      // Access the service instance properties directly
      const service = this as unknown as CallbacksTestService;
      service.setOnErrorCalled(true);
    },
  })
  async overrunMethod() {
    // Force a 6s delay, but interval is 500ms => 10× = 5s => termination
    await new Promise((r) => setTimeout(r, 6000));
  }

  isOnTerminateCalled() {
    return this.onTerminateCalled;
  }

  isOnErrorCalled() {
    return this.onErrorCalled;
  }

  setOnTerminateCalled(value: boolean) {
    this.onTerminateCalled = value;
  }

  setOnErrorCalled(value: boolean) {
    this.onErrorCalled = value;
  }
}
