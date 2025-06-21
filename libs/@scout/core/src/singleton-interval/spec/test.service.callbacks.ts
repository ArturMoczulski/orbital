// test.service.callbacks.ts
import { Injectable } from "@nestjs/common";
import { SingletonInterval } from "../singleton-interval.decorator";

@Injectable()
export class CallbacksTestService {
  private onTerminateCalled = false;
  private onErrorCalled = false;

  @SingletonInterval(500, {
    onTerminate: async function () {
      console.log("[CallbacksTestService] onTerminate called!");
      this.onTerminateCalled = true;
    },
    onError: async function (err) {
      console.log("[CallbacksTestService] onError called!", err.message);
      this.onErrorCalled = true;
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
}
