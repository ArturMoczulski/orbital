import {
  Global,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NatsConnection } from "nats";
import { Microservice } from "../microservice";

/**
 * Events emitted when microservices go up or down.
 */
export enum MicroserviceManagerEvents {
  Available = "microservice.available",
  Unavailable = "microservice.unavailable",
}

/**
 * Watches the NATS Service Framework for service-heartbeats
 * and emits Nest events when service status changes.
 */
/**
 * Registry of known microservices for health monitoring.
 */
export class MicroserviceRegistry {
  private static instance: MicroserviceRegistry;
  private services: Set<string> = new Set();

  private constructor() {}

  static getInstance(): MicroserviceRegistry {
    if (!MicroserviceRegistry.instance) {
      MicroserviceRegistry.instance = new MicroserviceRegistry();
    }
    return MicroserviceRegistry.instance;
  }

  register(serviceName: string): void {
    this.services.add(serviceName);
  }

  getAll(): string[] {
    return Array.from(this.services);
  }
}

/**
 * Watches the NATS Service Framework for service-heartbeats
 * and emits Nest events when service status changes.
 */
@Global()
@Injectable()
export class MicroserviceManagerService
  extends Microservice
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MicroserviceManagerService.name);
  private readonly registry = MicroserviceRegistry.getInstance();
  private readonly statusMap: Record<string, boolean> = {};

  constructor(
    @Inject("NATS_CLIENT") clientProxy: ClientProxy,
    @Inject("NatsConnection") private readonly nc: NatsConnection,
    private readonly eventEmitter: EventEmitter2
  ) {
    super(clientProxy, "microservice-manager");
  }

  /**
   * Register a microservice for health monitoring
   */
  registerService(serviceName: string): void {
    this.registry.register(serviceName);
    this.logger.log(`Registered service for monitoring: ${serviceName}`);
  }

  async onModuleInit() {
    try {
      // Check if NATS services API is available
      // @ts-ignore - Ignore TypeScript error for NATS services API
      if (this.nc.services && typeof this.nc.services.watch === "function") {
        // Get a service watcher for all services (*)
        // @ts-ignore - Ignore TypeScript error for NATS services API
        const iter = this.nc.services.watch("*");

        // Start async processing of service events
        (async () => {
          for await (const ev of iter) {
            // Check if service is up based on status
            const up = ev.status === "OK";

            // Emit the appropriate event with service info
            this.eventEmitter.emit(
              up
                ? MicroserviceManagerEvents.Available
                : MicroserviceManagerEvents.Unavailable,
              { microservice: ev.name }
            );
          }
        })().catch((err) => {
          console.error("Error in microservice watcher:", err);
        });
      } else {
        console.log(
          "NATS services API not available, microservice watcher disabled"
        );
      }
    } catch (err) {
      console.error("Failed to initialize microservice watcher:", err);
    }
  }

  /**
   * Clean up resources on module destroy
   */
  onModuleDestroy() {
    // Close any resources if needed
    this.logger.log("Cleaning up microservice manager resources");
  }
}
