// services/shared/core/src/nest/jobs-producer.spec.ts

import { Queue, Job } from "bull";
import { Gauge, Counter, register } from "prom-client";
// Add SingletonIntervalService imports for scheduling tests
import {
  SingletonIntervalService,
  getIntervalName,
} from "../singleton-interval/singleton-interval.service";
import { JobsProducer, JobsProducerMarkProcessingOrder } from "./jobs-producer";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

type MockData = { _id: string; value: number };

// Create a minimal concrete subclass for testing
class TestJobsProducer extends JobsProducer<MockData, number, number> {
  private pending: MockData[] = [];
  private processed: MockData[] = [];
  private failed: MockData[] = [];

  constructor(
    queue: Queue,
    produceProfileGauge: Gauge,
    pendingItemsProfileGauge: Gauge,
    markProcessingProfileGauge: Gauge,
    persistProfileGauge: Gauge,
    successCounter: Counter,
    failCounter: Counter,
    queueSizeGauge: Gauge,
    runningConsumersGauge: Gauge,
    eventEmitter: any = { on: jest.fn() }
  ) {
    super(
      queue,
      eventEmitter,
      produceProfileGauge,
      pendingItemsProfileGauge,
      markProcessingProfileGauge,
      persistProfileGauge,
      successCounter,
      failCounter,
      queueSizeGauge,
      runningConsumersGauge
    );
  }

  // Allow tests to set what pendingItems() returns
  public setPendingItems(items: MockData[]) {
    this.pending = items;
  }

  // Allow tests to inspect which items were "marked as processing"
  public getProcessedItems(): MockData[] {
    return this.processed;
  }

  // Allow tests to inspect which items were "marked as failed"
  public getFailedItems(): MockData[] {
    return this.failed;
  }

  public override jobName(): string {
    return "testJob";
  }

  protected override async pendingItems(): Promise<MockData[]> {
    // Return a shallow copy so tests can reassign
    return [...this.pending];
  }

  protected override async markItemsAsProcessing(
    items: Job<MockData>[]
  ): Promise<void> {
    // Simulate marking: record item.data into processed[]
    for (const job of items) {
      this.processed.push(job.data);
    }
  }

  protected override async onSuccess(
    successful: Job<MockData>[]
  ): Promise<number> {
    // Record successes and return count
    for (const job of successful) {
      this.processed.push(job.data);
    }
    return successful.length;
  }

  protected override async onFail(failed: Job<MockData>[]): Promise<number> {
    // Record failures and return count
    for (const job of failed) {
      this.failed.push(job.data);
    }
    return failed.length;
  }
}

describe("JobsProducer (abstract base)", () => {
  let mockQueue: jest.Mocked<Queue>;
  let producer: TestJobsProducer;
  let produceGauge: Gauge;
  let pendingGauge: Gauge;
  let markProcessingGauge: Gauge;
  let persistGauge: Gauge;
  let successCounter: Counter;
  let failCounter: Counter;
  let queueSizeGauge: Gauge;
  let runningConsumerGauge: Gauge;

  beforeEach(() => {
    register.clear();
    // Create simple no-op gauges/counters
    produceGauge = new Gauge({
      name: "produce_gauge",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    pendingGauge = new Gauge({
      name: "pending_gauge",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    markProcessingGauge = new Gauge({
      name: "mark_gauge",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    persistGauge = new Gauge({
      name: "persist_gauge",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    successCounter = new Counter({
      name: "success_counter",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    failCounter = new Counter({
      name: "fail_counter",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    queueSizeGauge = new Gauge({
      name: "queue_size_gauge",
      help: "test",
      labelNames: ["producer", "queue"],
    });
    runningConsumerGauge = {
      reset: jest.fn(),
      set: jest.fn(),
    } as unknown as Gauge;

    // Create a Jest-mocked Queue with all needed methods
    mockQueue = {
      getWaitingCount: jest.fn(),
      getDelayedCount: jest.fn(),
      getActiveCount: jest.fn(),
      getWaiting: jest.fn(),
      addBulk: jest.fn(),
      getJobs: jest.fn(),
      clean: jest.fn(),
      name: "mockQueue",
      // The following methods exist on Queue but are unused in the test
      getJob: jest.fn(),
      getJobCounts: jest.fn(),
      empty: jest.fn(),
      getCompletedCount: jest.fn(),
      getFailedCount: jest.fn(),
      getPausedCount: jest.fn(),
      getChildrenValues: jest.fn(),
      getStreams: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      remove: jest.fn(),
      retryJobs: jest.fn(),
      // @ts-ignore - we only need the above for our tests
    } as any;

    producer = new TestJobsProducer(
      mockQueue,
      produceGauge,
      pendingGauge,
      markProcessingGauge,
      persistGauge,
      successCounter,
      failCounter,
      queueSizeGauge,
      runningConsumerGauge
    );
  });

  describe("produce()", () => {
    it("should skip enqueue when queue is full", async () => {
      mockQueue.getWaitingCount.mockResolvedValue(50);
      mockQueue.getDelayedCount.mockResolvedValue(25);
      mockQueue.getActiveCount.mockResolvedValue(30); // total = 105
      // queueSize() returns 100, so outstanding (105) >= queueSize() => skip
      producer.setPendingItems([{ _id: "1", value: 10 }]);
      const result = await producer["produce"]();
      expect(result).toBe(0);
      expect(mockQueue.addBulk).not.toHaveBeenCalled();
    });

    it("should enqueue items and mark them POST_PRODUCE by default", async () => {
      // Simulate empty queue
      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getDelayedCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);

      // pendingItems returns two items
      const items: MockData[] = [
        { _id: "a", value: 1 },
        { _id: "b", value: 2 },
      ];
      producer.setPendingItems(items);

      // getWaiting (for forbidDuplicates) => return empty
      mockQueue.getWaiting.mockResolvedValue([]);

      // Simulate addBulk returning jobs wrapping same data
      mockQueue.addBulk.mockImplementation(async (ops: any[]) => {
        return ops.map((op) => ({
          id: op.opts!.jobId,
          data: op.data,
        })) as any as Job<MockData>[];
      });

      const result = await producer["produce"]();
      // Should have enqueued 2 items
      expect(result).toBe(2);

      // Since markProcessingOrder() is POST_PRODUCE, markItemsAsProcessing should have run once with the two jobs
      expect(producer.getProcessedItems()).toEqual([
        { _id: "a", value: 1 },
        { _id: "b", value: 2 },
      ]);

      // Verify addBulk was called once with correct payloads
      expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);
      const passedOps = mockQueue.addBulk.mock.calls[0][0];
      expect(Array.isArray(passedOps)).toBe(true);
      expect(passedOps.length).toBe(2);
      expect(passedOps[0]).toMatchObject({
        name: "testJob",
        data: { _id: "a", value: 1 },
        opts: { jobId: "a" },
      });
      expect(passedOps[1]).toMatchObject({
        name: "testJob",
        data: { _id: "b", value: 2 },
        opts: { jobId: "b" },
      });
    });

    it("should mark items PRE_PRODUCE when overridden in subclass", async () => {
      // Create a subclass that overrides markProcessingOrder
      class PreMarkProducer extends TestJobsProducer {
        protected override markProcessingOrder(): JobsProducerMarkProcessingOrder {
          return JobsProducerMarkProcessingOrder.PRE_PRODUCE;
        }
      }
      const preProducer = new PreMarkProducer(
        mockQueue,
        produceGauge,
        pendingGauge,
        markProcessingGauge,
        persistGauge,
        successCounter,
        failCounter,
        queueSizeGauge,
        runningConsumerGauge
      );

      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getDelayedCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);

      const items: MockData[] = [{ _id: "x", value: 42 }];
      preProducer.setPendingItems(items);

      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.addBulk.mockImplementation(async (ops: any[]) =>
        ops.map((op) => ({ id: op.opts!.jobId, data: op.data }) as any)
      );

      const result = await preProducer["produce"]();
      expect(result).toBe(1);

      // Since PRE_PRODUCE, markItemsAsProcessing should run before enqueue
      expect(preProducer.getProcessedItems()).toEqual([
        { _id: "x", value: 42 },
      ]);
    });

    it("should filter out duplicate items when forbidDuplicates() returns true", async () => {
      // Create subclass that forbids duplicates
      class NoDupProducer extends TestJobsProducer {
        public override forbidDuplicates(): boolean {
          return true;
        }
      }
      const ndProducer = new NoDupProducer(
        mockQueue,
        produceGauge,
        pendingGauge,
        markProcessingGauge,
        persistGauge,
        successCounter,
        failCounter,
        queueSizeGauge,
        runningConsumerGauge
      );

      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getDelayedCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);

      // Two pending items, one of which has an ID that appears in waiting jobs
      const pending: MockData[] = [
        { _id: "keep", value: 10 },
        { _id: "skip", value: 20 },
      ];
      ndProducer.setPendingItems(pending);

      // getWaiting returns a job whose data._id === 'skip'
      const waitingJob = {
        id: "skip",
        data: { _id: "skip", value: 20 },
      } as Job<MockData>;
      mockQueue.getWaiting.mockResolvedValue([waitingJob]);

      // When filtering, only 'keep' should remain
      mockQueue.addBulk.mockImplementation(async (ops: any[]) =>
        ops.map((op) => ({ id: op.opts!.jobId, data: op.data }) as any)
      );

      const result = await ndProducer["produce"]();
      expect(result).toBe(1);

      const enqueuedJobs = mockQueue.addBulk.mock.calls[0][0];
      expect(enqueuedJobs.length).toBe(1);
      expect(enqueuedJobs[0].data).toEqual({ _id: "keep", value: 10 });
    });
  });

  describe("persist()", () => {
    it("should handle completed jobs via onSuccess and clean them", async () => {
      // Prepare one "completed" job
      const completedJob = {
        id: "c1",
        data: { _id: "c1", value: 100 },
      } as Job<MockData>;
      mockQueue.getJobs.mockImplementation(
        async (types: any[], start?: number, end?: number) => {
          if (types.includes("completed")) {
            return [completedJob];
          }
          return [];
        }
      );
      mockQueue.clean.mockResolvedValue([] as any);

      await producer["persist"]();

      // onSuccess should have recorded the job's data in processedItems
      expect(producer.getProcessedItems()).toContainEqual({
        _id: "c1",
        value: 100,
      });
      // clean should have been called for the completed job
      expect(mockQueue.clean).toHaveBeenCalledWith(0, "completed", 1);
    });

    it("should handle failed jobs via onFail and clean them", async () => {
      // Prepare one "failed" job
      const failedJob = {
        id: "f1",
        data: { _id: "f1", value: 999 },
      } as Job<MockData>;
      mockQueue.getJobs.mockImplementation(
        async (types: any[], start?: number, end?: number) => {
          if (types.includes("failed")) {
            return [failedJob];
          }
          return [];
        }
      );
      mockQueue.clean.mockResolvedValue([] as any);

      await producer["persist"]();

      // onFail should have recorded the job's data in failedItems
      expect(producer.getFailedItems()).toContainEqual({
        _id: "f1",
        value: 999,
      });
      // clean should have been called for the failed job
      expect(mockQueue.clean).toHaveBeenCalledWith(0, "failed", 1);
    });

    it("should handle both completed and failed in one run", async () => {
      const jobA = { id: "a", data: { _id: "a", value: 5 } } as Job<MockData>;
      const jobB = { id: "b", data: { _id: "b", value: 6 } } as Job<MockData>;
      mockQueue.getJobs.mockImplementation(
        async (types: any[], start?: number, end?: number) => {
          if (types.includes("completed")) {
            return [jobA];
          }
          if (types.includes("failed")) {
            return [jobB];
          }
          return [];
        }
      );
      mockQueue.clean.mockResolvedValue([] as any);

      await producer["persist"]();

      expect(producer.getProcessedItems()).toContainEqual({
        _id: "a",
        value: 5,
      });
      expect(producer.getFailedItems()).toContainEqual({ _id: "b", value: 6 });
      expect(mockQueue.clean).toHaveBeenCalledTimes(2);
      expect(mockQueue.clean).toHaveBeenCalledWith(0, "completed", 1);
      expect(mockQueue.clean).toHaveBeenCalledWith(0, "failed", 1);
    });
  });
  // JobsProducer SingletonInterval registration tests
  describe("JobsProducer SingletonInterval registration", () => {
    let registerSpy: jest.SpyInstance;

    beforeEach(() => {
      registerSpy = jest.spyOn(
        SingletonIntervalService.prototype,
        "registerWithScheduler"
      );
      SingletonIntervalService.globalMutexMap.clear();
      SingletonIntervalService.intervalDefinitions.clear();
    });

    afterEach(() => {
      registerSpy.mockRestore();
    });

    let producer: TestJobsProducer;
    let produceSpy: jest.SpyInstance;
    let persistSpy: jest.SpyInstance;

    beforeAll(() => {
      jest.useFakeTimers();
      produceSpy = jest
        .spyOn(TestJobsProducer.prototype as any, "produce")
        .mockResolvedValue(0);
      persistSpy = jest
        .spyOn(TestJobsProducer.prototype as any, "persist")
        .mockResolvedValue(undefined);

      producer = new TestJobsProducer(
        mockQueue,
        produceGauge,
        pendingGauge,
        markProcessingGauge,
        persistGauge,
        successCounter,
        failCounter,
        queueSizeGauge,
        runningConsumerGauge
      );
      producer.onModuleInit();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should call produce() on interval", () => {
      expect(produceSpy).not.toHaveBeenCalled();
      jest.advanceTimersByTime(producer.productionFrequency());
      expect(produceSpy).toHaveBeenCalled();
    });

    it("should call persist() on interval", () => {
      expect(persistSpy).not.toHaveBeenCalled();
      jest.advanceTimersByTime(producer.persistanceFrequency());
      expect(persistSpy).toHaveBeenCalled();
    });
  });
});
