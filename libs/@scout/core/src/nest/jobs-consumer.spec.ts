// services/shared/core/src/nest/jobs-consumer.spec.ts

import { Job } from "bull";
import { Gauge, register } from "prom-client";
import { JobsQueueConsumer } from "./jobs-consumer";

type MockData = { id: string; payload: any };

// Concrete subclass for testing
class TestJobsConsumer extends JobsQueueConsumer<MockData> {
  public consumedJobs: MockData[] = [];
  public throwOnConsume = false;

  constructor(
    queueName: string,
    consumeProfileGauge: Gauge,
    eventEmitter: any
  ) {
    // We don’t actually need a real Queue; only its name is used for labels.
    // So we pass an object with a `name` property.
    // The type assertion to `any` satisfies the constructor signature.
    super({ name: queueName } as any, consumeProfileGauge, eventEmitter);
  }

  protected override uniqueKey(): keyof MockData {
    return "id";
  }

  // consume() will either record the job’s data or throw, depending on `throwOnConsume`.
  protected override async consume(job: Job<MockData>): Promise<any> {
    if (this.throwOnConsume) {
      throw new Error("consume-error");
    }
    this.consumedJobs.push(job.data);
    return "ok";
  }
}

describe("JobsQueueConsumer (abstract base)", () => {
  let consumeProfileGauge: Gauge;
  let runningConsumersGauge: Gauge;
  let consumer: TestJobsConsumer;
  const QUEUE_NAME = "test-queue";

  beforeEach(() => {
    // Clear any previously registered metrics to avoid duplicates
    register.clear();

    // Create real Gauge instances for testing; labelNames must match code usage
    consumeProfileGauge = new Gauge({
      name: "consume_profile_gauge",
      help: "Duration of process() in milliseconds",
      labelNames: ["queue"],
    });
    runningConsumersGauge = new Gauge({
      name: "running_consumers_gauge",
      help: "Number of consumers currently running",
      labelNames: ["queue"],
    });

    consumer = new TestJobsConsumer(
      QUEUE_NAME,
      consumeProfileGauge,
      runningConsumersGauge
    );
  });

  describe("process()", () => {
    it("should call consume(), update gauges, and return value on success", async () => {
      // Spy on gauge methods
      const incSpy = jest.spyOn(runningConsumersGauge, "inc");
      const decSpy = jest.spyOn(runningConsumersGauge, "dec");
      const setSpy = jest.spyOn(consumeProfileGauge, "set");

      // Create a dummy Job object
      const mockJob = { data: { id: "123", payload: "abc" } } as Job<MockData>;

      // Call process()
      const result = await consumer.process(mockJob);

      // consume() returns "ok"
      expect(result).toBe("ok");

      // Verify consume() recorded job data
      expect(consumer.consumedJobs).toEqual([{ id: "123", payload: "abc" }]);

      // runningConsumersGauge.inc should be called once with label { queue: QUEUE_NAME }
      expect(incSpy).toHaveBeenCalledWith({ queue: QUEUE_NAME });

      // runningConsumersGauge.dec should be called once with label { queue: QUEUE_NAME }
      expect(decSpy).toHaveBeenCalledWith({ queue: QUEUE_NAME });

      // consumeProfileGauge.set should be called once with { queue: QUEUE_NAME } and a numeric duration
      expect(setSpy).toHaveBeenCalledTimes(1);
      const calls = setSpy.mock.calls as unknown as any[][];
      const firstCallArgs = calls[0];
      let labelObj: any, duration: any;
      if (firstCallArgs.length === 2) {
        labelObj = firstCallArgs[0];
        duration = firstCallArgs[1];
        expect(labelObj).toEqual({ queue: QUEUE_NAME });
      } else {
        duration = firstCallArgs[0];
      }
      expect(typeof duration).toBe("number");
    });

    it("should decrement runningConsumersGauge and set consumeProfileGauge even if consume() throws", async () => {
      // Configure consume() to throw
      consumer.throwOnConsume = true;

      const incSpy = jest.spyOn(runningConsumersGauge, "inc");
      const decSpy = jest.spyOn(runningConsumersGauge, "dec");
      const setSpy = jest.spyOn(consumeProfileGauge, "set");

      const mockJob = { data: { id: "err", payload: "fail" } } as Job<MockData>;

      // process() should rethrow the error from consume()
      await expect(consumer.process(mockJob)).rejects.toThrow("consume-error");

      // runningConsumersGauge.inc should still be called once
      expect(incSpy).toHaveBeenCalledWith({ queue: QUEUE_NAME });

      // runningConsumersGauge.dec should still be called once in finally block
      expect(decSpy).toHaveBeenCalledWith({ queue: QUEUE_NAME });

      // consumeProfileGauge.set should still be called once with a numeric duration
      expect(setSpy).toHaveBeenCalledTimes(1);
      const calls = setSpy.mock.calls as unknown as any[][];
      const firstCallArgs = calls[0];
      let labelObj: any, duration: any;
      if (firstCallArgs.length === 2) {
        labelObj = firstCallArgs[0];
        duration = firstCallArgs[1];
        expect(labelObj).toEqual({ queue: QUEUE_NAME });
      } else {
        duration = firstCallArgs[0];
      }
      expect(typeof duration).toBe("number");
    });
  });
});
