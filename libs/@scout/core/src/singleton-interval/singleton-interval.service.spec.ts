import {
  SingletonIntervalService,
  SingletonIntervalEvents,
  getEventName,
} from "./singleton-interval.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

describe("SingletonIntervalService", () => {
  let emitter: { emit: jest.Mock };

  beforeEach(() => {
    emitter = { emit: jest.fn() };
    SingletonIntervalService.eventEmitter = emitter as unknown as EventEmitter2;
    // Reset static maps for isolation
    SingletonIntervalService.globalMutexMap.clear();
    SingletonIntervalService.initEmittedFor.clear();
    SingletonIntervalService.intervalDefinitions.clear();
    delete SingletonIntervalService.isMicroserviceResponsive;
  });

  it("should emit Init, Started, Success, and Finish on successful run", async () => {
    class Dummy {
      public count = 0;
      async task() {
        this.count++;
      }
    }

    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100
    );
    const instance = new Dummy();
    await service.run(instance, []);

    expect(emitter.emit).toHaveBeenCalledWith(
      getEventName(`${Dummy.name}.task`, SingletonIntervalEvents.Init),
      expect.any(Object)
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      getEventName(`${Dummy.name}.task`, SingletonIntervalEvents.Started),
      expect.any(Object)
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      getEventName(`${Dummy.name}.task`, SingletonIntervalEvents.Success),
      expect.any(Object)
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      getEventName(`${Dummy.name}.task`, SingletonIntervalEvents.Finish),
      expect.any(Object)
    );
    expect(instance.count).toBe(1);
  });

  it("should emit Error when the method throws and allow subsequent runs", async () => {
    class Dummy {
      public count = 0;
      async task() {
        this.count++;
        throw new Error("failure");
      }
    }

    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100
    );
    const instance = new Dummy();
    await service.run(instance, []);
    await service.run(instance, []);

    const errorEvent = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.Error
    );
    expect(emitter.emit).toHaveBeenCalledWith(errorEvent, expect.any(Object));
    expect(instance.count).toBe(2);
  });

  it("should skip execution when conditions are not met", async () => {
    class Dummy {
      public count = 0;
      async task() {
        this.count++;
      }
    }

    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100,
      { conditions: { alwaysFalse: async () => false } }
    );
    const instance = new Dummy();
    await service.run(instance, []);

    const skipEvent = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.ConditionsNotMet
    );
    expect(emitter.emit).toHaveBeenCalledWith(skipEvent, expect.any(Object));
    expect(instance.count).toBe(0);
  });

  it("should skip execution when no health-check and microservices specified", async () => {
    class Dummy {
      public count = 0;
      async task() {
        this.count++;
      }
    }

    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100,
      { microservices: ["A"] }
    );
    const instance = new Dummy();
    await service.run(instance, []);

    const skipEvent = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.MicroservicesUnresponsive
    );
    expect(emitter.emit).toHaveBeenCalledWith(skipEvent, expect.any(Object));
    expect(instance.count).toBe(0);
  });

  it("should run when health-checks pass for microservices", async () => {
    SingletonIntervalService.isMicroserviceResponsive = jest
      .fn()
      .mockResolvedValue(true);

    class Dummy {
      public count = 0;
      async task() {
        this.count++;
      }
    }

    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100,
      { microservices: ["A", "B"] }
    );
    const instance = new Dummy();
    await service.run(instance, []);

    // Called once per microservice
    expect(
      SingletonIntervalService.isMicroserviceResponsive
    ).toHaveBeenCalledTimes(2);

    expect(emitter.emit).toHaveBeenCalledWith(
      getEventName(`${Dummy.name}.task`, SingletonIntervalEvents.Success),
      expect.any(Object)
    );
    expect(instance.count).toBe(1);
  });
});

// Additional tests for static registration and advanced behaviors
describe("SingletonIntervalService static registration and advanced behaviors", () => {
  let emitter: { emit: jest.Mock };
  beforeEach(() => {
    emitter = { emit: jest.fn() };
    SingletonIntervalService.eventEmitter = emitter as unknown as EventEmitter2;
    // reset static storage
    SingletonIntervalService.globalMutexMap.clear();
    SingletonIntervalService.initEmittedFor.clear();
    SingletonIntervalService.intervalDefinitions.clear();
    delete SingletonIntervalService.isMicroserviceResponsive;
  });
  it("should register definition and mutex map entry upon instantiation", () => {
    class Dummy {
      async task() {}
    }
    new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      200
    );
    const name = `${Dummy.name}.task`;
    expect(
      SingletonIntervalService.intervalDefinitions.get(name)
    ).toMatchObject({ name, interval: 200 });
    expect(SingletonIntervalService.globalMutexMap.has(name)).toBe(true);
  });

  it("should emit AlreadyRunning when previous execution is still running", async () => {
    class Dummy {
      async task() {
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      10
    );
    const instance = new Dummy();
    // start first run but do not await to hold mutex
    const p1 = service.run(instance, []);
    // allow first run to acquire mutex
    await new Promise((r) => setTimeout(r, 1));
    // now second run should detect AlreadyRunning
    await service.run(instance, []);
    await p1;
    const key = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.AlreadyRunning
    );
    expect(emitter.emit).toHaveBeenCalledWith(key, expect.any(Object));
  });

  it("should emit LongRunning when execution takes longer than interval", async () => {
    class Dummy {
      async task() {
        await new Promise((r) => setTimeout(r, 30));
      }
    }
    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      10
    );
    const instance = new Dummy();
    await service.run(instance, []);
    const key = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.LongRunning
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      key,
      expect.objectContaining({ elapsed: expect.any(Number) })
    );
  });

  it("should handle onTerminate callback when terminated", async () => {
    const onTerminateMock = jest.fn();
    class Dummy {
      async task() {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      10,
      { onTerminate: onTerminateMock }
    );
    const instance = new Dummy();
    await service.run(instance, []);
    expect(onTerminateMock).toHaveBeenCalled();
    const key = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.Terminated
    );
    expect(emitter.emit).toHaveBeenCalledWith(key, expect.any(Object));
  });
});

// Tests for onError and finally callbacks
describe("SingletonIntervalService callbacks", () => {
  let emitter: { emit: jest.Mock };
  beforeEach(() => {
    emitter = { emit: jest.fn() };
    SingletonIntervalService.eventEmitter = emitter as unknown as EventEmitter2;
    SingletonIntervalService.globalMutexMap.clear();
    SingletonIntervalService.initEmittedFor.clear();
    SingletonIntervalService.intervalDefinitions.clear();
    delete SingletonIntervalService.isMicroserviceResponsive;
  });

  it("should handle onError callback when error occurs", async () => {
    const onErrorMock = jest.fn();
    class Dummy {
      async task() {
        throw new Error("fatal");
      }
    }
    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100,
      { onError: onErrorMock }
    );
    const instance = new Dummy();
    await service.run(instance, []);
    expect(onErrorMock).toHaveBeenCalled();
    const key = getEventName(
      `${Dummy.name}.task`,
      SingletonIntervalEvents.Error
    );
    expect(emitter.emit).toHaveBeenCalledWith(key, expect.any(Object));
  });

  it("should handle finally callback after execution", async () => {
    const finallyMock = jest.fn();
    class Dummy {
      async task() {}
    }
    const service = new SingletonIntervalService(
      `${Dummy.name}.task`,
      Dummy.prototype.task,
      100,
      { finally: finallyMock }
    );
    const instance = new Dummy();
    await service.run(instance, []);
    expect(finallyMock).toHaveBeenCalled();
  });
  describe("initial suppression behavior for ConditionsNotMet logs", () => {
    let originalStartTime: number;
    beforeAll(() => {
      originalStartTime = SingletonIntervalService.appStartTimeMs;
      SingletonIntervalService.appStartTimeMs = Date.now();
    });
    afterAll(() => {
      SingletonIntervalService.appStartTimeMs = originalStartTime;
    });

    it("should suppress microservice-only logs during initial window", () => {
      class Dummy {
        async task() {}
      }
      const service = new SingletonIntervalService(
        `${Dummy.name}.task`,
        Dummy.prototype.task,
        100
      );
      const warnSpy = jest.spyOn((service as any).logger, "warn");
      (service as any).logConditionsNotMet([
        "Microservice A needs to be available",
      ]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("should warn for non-microservice conditions during initial window", () => {
      class Dummy {
        async task() {}
      }
      const service = new SingletonIntervalService(
        `${Dummy.name}.task`,
        Dummy.prototype.task,
        100
      );
      const warnSpy = jest.spyOn((service as any).logger, "warn");
      (service as any).logConditionsNotMet(["RegularConditionFailed"]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("RegularConditionFailed")
      );
    });
  });
});
