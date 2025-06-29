import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ClientProxy } from "@nestjs/microservices";
import { NatsConnection } from "nats";
import { Microservice } from "../microservice";
/**
 * Events emitted when microservices go up or down.
 */
export declare enum MicroserviceManagerEvents {
    Available = "microservice.available",
    Unavailable = "microservice.unavailable"
}
/**
 * Watches the NATS Service Framework for service-heartbeats
 * and emits Nest events when service status changes.
 */
/**
 * Registry of known microservices for health monitoring.
 */
export declare class MicroserviceRegistry {
    private static instance;
    private services;
    private constructor();
    static getInstance(): MicroserviceRegistry;
    register(serviceName: string): void;
    getAll(): string[];
}
/**
 * Watches the NATS Service Framework for service-heartbeats
 * and emits Nest events when service status changes.
 */
export declare class MicroserviceManagerService extends Microservice implements OnModuleInit, OnModuleDestroy {
    private readonly nc;
    private readonly eventEmitter;
    private readonly logger;
    private readonly registry;
    private readonly statusMap;
    constructor(clientProxy: ClientProxy, nc: NatsConnection, eventEmitter: EventEmitter2);
    /**
     * Register a microservice for health monitoring
     */
    registerService(serviceName: string): void;
    onModuleInit(): Promise<void>;
    /**
     * Clean up resources on module destroy
     */
    onModuleDestroy(): void;
}
