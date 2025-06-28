import { SingletonInterval } from "./singleton-interval.decorator";
import { SingletonIntervalService } from "./singleton-interval.service";

describe("@SingletonInterval decorator", () => {
  it("instantiates service, registers with scheduler, and wraps method to call service.run", () => {
    // Spy on service methods
    const registerSpy = jest.spyOn(
      SingletonIntervalService.prototype,
      "registerWithScheduler"
    );
    const runSpy = jest.spyOn(SingletonIntervalService.prototype, "run");

    class TestClass {
      methodCalled = false;
      @SingletonInterval(200)
      method(...args: any[]) {
        this.methodCalled = true;
      }
    }

    const instance = new TestClass();
    // Call the decorated method
    instance.method(1, 2, 3);

    // Should register scheduler once at decoration time
    expect(registerSpy).toHaveBeenCalledWith(
      TestClass.prototype,
      "method",
      expect.any(Object)
    );
    // Should delegate execution to service.run
    expect(runSpy).toHaveBeenCalledWith(instance, [1, 2, 3]);
    // Original method logic should not run directly
    expect(instance.methodCalled).toBe(false);
  });
});
