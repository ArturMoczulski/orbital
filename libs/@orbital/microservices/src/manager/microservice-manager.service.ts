import { Global, Injectable, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NatsConnection } from "nats";

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
@Global()
@Injectable()
export class MicroserviceManagerService implements OnModuleInit {
  constructor(
    private readonly nc: NatsConnection,
    private readonly eventEmitter: EventEmitter2
  ) {}

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
}
