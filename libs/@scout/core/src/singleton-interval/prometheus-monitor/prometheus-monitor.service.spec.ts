import {
  IntervalsRegistryService,
  IntervalState,
  IntervalStatus,
} from "../intervals-registry.service";
import { Gauge, Counter } from "prom-client";
import { PrometheusMonitorService } from "./prometheus-monitor.service";

describe("PrometheusMonitorService", () => {
  let monitorService: PrometheusMonitorService;
  let mockRegistryService: Partial<IntervalsRegistryService>;

  // Mocked Prometheus metrics
  let mockLastRunDurationGauge: Partial<Gauge<string>>;
  let mockRunsCounter: Partial<Counter<string>>;
  let mockStateGauge: Partial<Gauge<string>>;

  beforeEach(async () => {
    // 1) Mock the registry service
    mockRegistryService = {
      getStatusReport: jest.fn().mockReturnValue([
        {
          key: "TestInterval",
          status: IntervalState.RUNNING,
          locked: true,
          lastDuration: 1200,
          lastError: undefined,
        } as IntervalStatus,
      ]),
    };

    // 2) Mock the Prometheus metrics
    mockLastRunDurationGauge = {
      set: jest.fn(),
    };
    mockRunsCounter = {
      inc: jest.fn(),
    };
    mockStateGauge = {
      set: jest.fn(),
    };

    // 3) Create the service instance (no Nest testing module needed for a simple unit test)
    monitorService = new PrometheusMonitorService(
      mockRegistryService as IntervalsRegistryService,
      mockLastRunDurationGauge as Gauge<string>,
      mockRunsCounter as Counter<string>,
      mockStateGauge as Gauge<string>
    );
  });

  it("should update Prometheus metrics based on the intervals registry report", () => {
    // Call the method under test
    monitorService.updateIntervalMetrics();

    // Check that we got the status report
    expect(mockRegistryService.getStatusReport).toHaveBeenCalledTimes(1);

    // We expect the lastRunDurationGauge to be set to 1200 for 'TestInterval'
    expect(mockLastRunDurationGauge.set).toHaveBeenCalledWith(
      { interval_name: "TestInterval" },
      1200
    );

    // Because lastDuration > 0, the runs counter increments
    expect(mockRunsCounter.inc).toHaveBeenCalledWith({
      interval_name: "TestInterval",
    });

    // IntervalState.RUNNING => code=2 (based on your mapping)
    expect(mockStateGauge.set).toHaveBeenCalledWith(
      { interval_name: "TestInterval" },
      2
    );
  });

  it("should not increment runsCounter if lastDuration is zero", () => {
    // Change the mock to have lastDuration=0
    (mockRegistryService.getStatusReport as jest.Mock).mockReturnValue([
      {
        key: "NoDurationInterval",
        status: IntervalState.HEALTHY,
        lastDuration: 0,
      } as IntervalStatus,
    ]);

    monitorService.updateIntervalMetrics();

    // lastRunDurationGauge set to 0
    expect(mockLastRunDurationGauge.set).toHaveBeenCalledWith(
      { interval_name: "NoDurationInterval" },
      0
    );
    // runsCounter should not increment
    expect(mockRunsCounter.inc).not.toHaveBeenCalled();
    // stateGauge should be set to the code for HEALTHY=5
    expect(mockStateGauge.set).toHaveBeenCalledWith(
      { interval_name: "NoDurationInterval" },
      5
    );
  });
});
