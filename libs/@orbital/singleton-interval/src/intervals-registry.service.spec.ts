// intervals-registry.service.spec.ts

import {
  IntervalsRegistryService,
  IntervalState,
} from "./intervals-registry.service";
import { SingletonInterval } from "./singleton-interval.decorator";

describe("IntervalsRegistryService", () => {
  let service: IntervalsRegistryService;

  beforeEach(() => {
    // Create a new instance before each test.
    // If you need an EventEmitter2, mock it or pass {} as a stub.
    service = new IntervalsRegistryService({} as any, {} as any, {} as any);

    // Clear the internal registry map
    (service as any).registry.clear();

    // Clear or reset the global mutex map
    SingletonInterval.globalMutexMap.clear();
    SingletonInterval.intervalDefinitions.set("MyService.myMethod", {
      name: "MyService.myMethod",
      interval: 1000,
    });
  });

  it("should register a new interval if not already registered", () => {
    const uniqueKey = "MyService.myMethod";
    // Initially nothing
    expect(service.getIntervalRecord(uniqueKey)).toBeUndefined();

    service.register(uniqueKey, 1000);
    const record = service.getIntervalRecord(uniqueKey);
    expect(record).toBeDefined();
    expect(record?.intervalMs).toBe(1000);
    expect(record?.lastStart).toBe(0);
  });

  it("should have all the intervals registered", () => {
    const uniqueKey = "MyService.myMethod";
    service.onModuleInit();
    // Initially nothing
    expect(service["registry"].size).toBe(1);
  });

  it("should mark start correctly", () => {
    const uniqueKey = "StartTest.interval";
    service.register(uniqueKey, 2000);

    // We'll simulate the old "markStart" logic
    // You can add an instance method if needed. For example:
    service.handleStarted({ intervalName: uniqueKey, timestamp: Date.now() });

    const record = service.getIntervalRecord(uniqueKey);
    expect(record?.lastStart).toBeGreaterThan(0);
    expect(record?.locked).toBe(true);
  });

  it("should mark stop and record duration", () => {
    const uniqueKey = "StopTest.interval";
    service.register(uniqueKey, 2000);

    // Instead of markStop(...), we can simulate the "Finish" event listener:
    service.handleFinish({
      intervalName: uniqueKey,
      timestamp: Date.now(),
      elapsed: 1234,
    });

    const record = service.getIntervalRecord(uniqueKey);
    expect(record?.lastDuration).toBe(1234);
    expect(record?.locked).toBe(false);
  });

  it("should mark errors and clear errors", () => {
    const uniqueKey = "ErrorTest.interval";
    service.register(uniqueKey, 1000);

    const error = new Error("Test error");
    // Instead of markError, we can do:
    service.handleError({ intervalName: uniqueKey, error });

    let record = service.getIntervalRecord(uniqueKey);
    expect(record?.lastError).toBe(error);

    // Clear error by simulating a "Success" event
    service.handleSuccess({ intervalName: uniqueKey, timestamp: Date.now() });
    record = service.getIntervalRecord(uniqueKey);
    expect(record?.lastError).toBeUndefined();
  });

  it("should mark conditions not met and clear them", () => {
    const uniqueKey = "CondTest.interval";
    service.register(uniqueKey, 1000);

    service.handleConditionsNotMet({
      intervalName: uniqueKey,
      failedConditions: ["cond1", "cond2"],
    });

    let record = service.getIntervalRecord(uniqueKey);
    expect(record?.notMetConditions).toEqual(["cond1", "cond2"]);
    expect(record?.locked).toBe(false);

    // Clear conditions not met by simulating a "Started" or "Success" event
    service.handleStarted({ intervalName: uniqueKey, timestamp: Date.now() });
    record = service.getIntervalRecord(uniqueKey);
    expect(record?.notMetConditions).toBeUndefined();
  });

  it("should mark microservices unavailable and clear it", () => {
    const uniqueKey = "MicroserviceTest.interval";
    service.register(uniqueKey, 1000);

    service.handleMicroservicesUnresponsive({
      intervalName: uniqueKey,
      unresponsiveMicroservices: ["PaymentService"],
    });
    let record = service.getIntervalRecord(uniqueKey);
    expect(record?.microservicesUnavailable).toBe(true);
    expect(record?.locked).toBe(false);

    // Clear microservices unavailable by simulating a "Started" event
    service.handleStarted({ intervalName: uniqueKey, timestamp: Date.now() });
    record = service.getIntervalRecord(uniqueKey);
    expect(record?.microservicesUnavailable).toBe(false);
  });

  describe("getStatusReport()", () => {
    it("should report INIT vs. LATE when never started", () => {
      const initKey = "Init.interval";
      service.register(initKey, 1000);

      // No start yet, but creation was just now, so it's < interval => INIT
      let report = service.getStatusReport();
      let item = report.find((r) => r.key === initKey);
      expect(item?.status).toBe(IntervalState.INIT);

      // Advance time artificially by changing createTime so it's > interval => LATE
      const record = service.getIntervalRecord(initKey);
      if (record) {
        record.createTime = Date.now() - 2000; // 2s ago
      }
      report = service.getStatusReport();
      item = report.find((r) => r.key === initKey);
      expect(item?.status).toBe(IntervalState.LATE);
    });

    it("should report RUNNING / SLOW / JAMMED when locked", () => {
      const runKey = "Locked.interval";
      service.register(runKey, 1000);

      // Simulate acquiring the lock
      const record = service.getIntervalRecord(runKey);
      if (record) {
        record.locked = true;
      }

      // Mark start 0.5s ago => RUNNING
      if (record) {
        record.lastStart = Date.now() - 500;
      }
      let report = service.getStatusReport();
      let item = report.find((r) => r.key === runKey);
      expect(item?.status).toBe(IntervalState.RUNNING);

      // Mark start 2s ago => SLOW (exceeds 1s but less than 10×=10s)
      if (record) {
        record.lastStart = Date.now() - 2000;
      }
      report = service.getStatusReport();
      item = report.find((r) => r.key === runKey);
      expect(item?.status).toBe(IntervalState.SLOW);

      // Mark start 12s ago => jammed (no error, but beyond 10×=10s)
      if (record) {
        record.lastStart = Date.now() - 12000;
      }
      report = service.getStatusReport();
      item = report.find((r) => r.key === runKey);
      expect(item?.status).toBe(IntervalState.JAMMED);
    });

    it("should show ERROR if locked and lastError is set", () => {
      const errKey = "LockedError.interval";
      service.register(errKey, 1000);

      const record = service.getIntervalRecord(errKey);
      if (record) {
        record.locked = true;
        record.lastError = new Error("Some error");
        record.lastStart = Date.now() - 2000; // started 2s ago
      }

      const report = service.getStatusReport();
      const item = report.find((r) => r.key === errKey);
      expect(item?.status).toBe(IntervalState.ERROR);
    });

    it("should show HEALTHY, STOPPED, or ERROR if not locked and has run at least once", () => {
      const doneKey = "Done.interval";
      service.register(doneKey, 1000);

      const record = service.getIntervalRecord(doneKey);
      if (record) {
        record.locked = false;
        // Mark start 0.5s ago => healthy
        record.lastStart = Date.now() - 500;
      }
      let report = service.getStatusReport();
      let item = report.find((r) => r.key === doneKey);
      expect(item?.status).toBe(IntervalState.HEALTHY);

      // Past 10× => STOPPED
      if (record) {
        record.lastStart = Date.now() - 20000; // 20s
      }
      report = service.getStatusReport();
      item = report.find((r) => r.key === doneKey);
      expect(item?.status).toBe(IntervalState.STOPPED);

      // Mark an error => then should be ERROR
      if (record) {
        record.lastError = new Error("some error");
      }
      report = service.getStatusReport();
      item = report.find((r) => r.key === doneKey);
      expect(item?.status).toBe(IntervalState.ERROR);
    });

    it("should show CONDITIONS_NOT_MET if not locked and conditions fail", () => {
      const condKey = "CondNotMet.interval";
      service.register(condKey, 1000);

      const record = service.getIntervalRecord(condKey);
      if (record) {
        record.locked = false;
        record.lastStart = Date.now() - 500; // means it's run at least once
        record.notMetConditions = ["cond1"];
      }

      const report = service.getStatusReport();
      const item = report.find((r) => r.key === condKey);
      expect(item?.status).toBe(IntervalState.CONDITIONS_NOT_MET);
    });

    it("should show MICROSERVICES_UNAVAILABLE if not locked and microservices are unavailable", () => {
      const msKey = "MicroserviceFail.interval";
      service.register(msKey, 1000);

      const record = service.getIntervalRecord(msKey);
      if (record) {
        record.locked = false;
        record.lastStart = Date.now() - 500;
        record.microservicesUnavailable = true;
      }

      const report = service.getStatusReport();
      const item = report.find((r) => r.key === msKey);
      expect(item?.status).toBe(IntervalState.MICROSERVICES_UNAVAILABLE);
    });
  });
});
