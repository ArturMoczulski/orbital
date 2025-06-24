import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Global,
} from "@nestjs/common";
import { ClientProxy, ClientsModule, Transport } from "@nestjs/microservices";
import { MicroserviceManagerService } from "./microservice-manager.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

/**
 * Options for configuring the MicroserviceManagerModule
 */
export interface MicroserviceManagerModuleOptions {
  /**
   * Optional custom token name for the NATS client
   * @default "NATS_CLIENT"
   */
  clientToken?: string;

  /**
   * Optional custom token name for the NATS connection
   * @default "NatsConnection"
   */
  connectionToken?: string;

  /**
   * Optional NATS server URL
   * @default "nats://localhost:4222"
   */
  natsUrl?: string;
}

/**
 * Async options for configuring the MicroserviceManagerModule
 */
export interface MicroserviceManagerModuleAsyncOptions {
  /**
   * Optional custom token name for the NATS client
   * @default "NATS_CLIENT"
   */
  clientToken?: string;

  /**
   * Optional custom token name for the NATS connection
   * @default "NatsConnection"
   */
  connectionToken?: string;

  /**
   * Optional imports to be included in the module
   */
  imports?: any[];

  /**
   * Factory function to create the MicroserviceManagerService
   */
  useFactory?: (
    ...args: any[]
  ) => Promise<MicroserviceManagerService> | MicroserviceManagerService;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
}

/**
 * Module for microservice discovery and health monitoring.
 * Provides the MicroserviceManagerService which monitors microservice availability
 * and emits events when services go up or down.
 */
@Global()
@Module({})
export class MicroserviceManagerModule {
  /**
   * Configure the MicroserviceManagerModule to use existing NATS client and connection
   * from the application module.
   *
   * @param options Configuration options
   * @returns Dynamic module configuration
   */
  static forRoot(
    options: MicroserviceManagerModuleOptions = {}
  ): DynamicModule {
    const clientToken = options.clientToken || "NATS_CLIENT";
    const connectionToken = options.connectionToken || "NatsConnection";
    const natsUrl = options.natsUrl || "nats://localhost:4222";

    return {
      module: MicroserviceManagerModule,
      imports: [ClientsModule],
      providers: [
        {
          provide: MicroserviceManagerService,
          useFactory: (clientProxy, natsConnection, eventEmitter) => {
            return new MicroserviceManagerService(
              clientProxy,
              natsConnection,
              eventEmitter
            );
          },
          inject: [clientToken, connectionToken, EventEmitter2.name],
        },
      ],
      exports: [MicroserviceManagerService],
    };
  }
}
