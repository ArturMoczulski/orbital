import { DynamicModule } from "@nestjs/common";
import { MicroserviceManagerService } from "./microservice-manager.service";
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
    useFactory?: (...args: any[]) => Promise<MicroserviceManagerService> | MicroserviceManagerService;
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
export declare class MicroserviceManagerModule {
    /**
     * Configure the MicroserviceManagerModule to use existing NATS client and connection
     * from the application module.
     *
     * @param options Configuration options
     * @returns Dynamic module configuration
     */
    static forRoot(options?: MicroserviceManagerModuleOptions): DynamicModule;
}
