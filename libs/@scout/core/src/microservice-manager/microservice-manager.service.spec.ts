// microservice-manager.service.spec.ts

import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { of, throwError } from "rxjs";
import {
  MicroserviceManagerService,
  ScoutMicroservices,
} from "./microservice-manager.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SingletonInterval } from "../singleton-interval";

describe("MicroserviceManagerService", () => {
  let service: MicroserviceManagerService;
  let natsClientMock: ClientProxy;

  beforeEach(async () => {
    // Create a mock for ClientProxy
    natsClientMock = {
      send: jest.fn(),
    } as any;

    // Provide the mock in the Nest test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: "NATS_SERVER",
          useValue: natsClientMock,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        MicroserviceManagerService,
      ],
    }).compile();

    service = module.get<MicroserviceManagerService>(
      MicroserviceManagerService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register()", () => {
    it("should add a microservice to the registry if not already present", () => {
      service.register(ScoutMicroservices.JobsQueue);
      // @ts-expect-error: access the protected registry for test
      expect(service.registry).toEqual(["jobs-queue"]);

      // register again -> should not duplicate
      service.register(ScoutMicroservices.JobsQueue);
      // still only 1 item
      // @ts-expect-error
      expect(service.registry).toEqual(["jobs-queue"]);
    });
  });

  describe("registerScoutMicroservices()", () => {
    it("should register all microservices from ScoutMicroservices enum", () => {
      service.registerScoutMicroservices();
      // @ts-expect-error
      expect(service.registry).toEqual(
        expect.arrayContaining(Object.values(ScoutMicroservices))
      );
      expect(
        // @ts-expect-error
        service.registry.length
      ).toBe(Object.values(ScoutMicroservices).length);
    });
  });

  describe("onModuleInit()", () => {
    it("should register all scout microservices and bind SingletonInterval.isMicroserviceResponsive", () => {
      // Initially, registry is empty
      // @ts-expect-error
      expect(service.registry).toHaveLength(0);

      service.onModuleInit();

      // Now registry should contain all microservices
      // @ts-expect-error
      expect(service.registry).toEqual(
        expect.arrayContaining(Object.values(ScoutMicroservices))
      );

      // Also, SingletonInterval.isMicroserviceResponsive should be set
      expect(typeof SingletonInterval.isMicroserviceResponsive).toBe(
        "function"
      );
    });
  });

  describe("healthCheck()", () => {
    beforeEach(() => {
      // Make sure at least one microservice is registered
      service.register(ScoutMicroservices.JobsQueue);
    });

    it("should throw if microservice not registered", async () => {
      await expect(
        service.healthCheck("unknown-service" as any)
      ).rejects.toThrow("Microservice unknown-service not registered");
    });

    it('should return true if NATS returns "ok"', async () => {
      // mock natsClientMock.send(...) => returns 'ok'
      (natsClientMock.send as jest.Mock).mockReturnValue(of("ok"));

      const result = await service.healthCheck(ScoutMicroservices.JobsQueue);
      expect(result).toBe(true);
      // check that nats client was called properly
      expect(natsClientMock.send).toHaveBeenCalledWith(
        "jobs-queue-health-check",
        {}
      );
    });

    it('should return false if NATS returns anything other than "ok"', async () => {
      (natsClientMock.send as jest.Mock).mockReturnValue(of("not-ok"));

      const result = await service.healthCheck(ScoutMicroservices.JobsQueue);
      expect(result).toBe(false);
    });

    it("should return false if NATS throws an error", async () => {
      (natsClientMock.send as jest.Mock).mockReturnValue(
        throwError(() => new Error("NATS error"))
      );

      const result = await service.healthCheck(ScoutMicroservices.JobsQueue);
      expect(result).toBe(false);
    });
  });
});
