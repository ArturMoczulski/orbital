import { NatsConnection } from "nats";

declare module "nats" {
  export interface NatsConnection {
    services: () => ServicesAPI;
  }

  export interface ServicesAPI {
    watch(pattern?: string): AsyncIterable<ServiceInfo>;
    list?(): AsyncIterable<ServiceInfo>;
  }

  export interface ServiceInfo {
    name: string;
    id: string;
    version?: string;
    description?: string;
    status: "OK" | "OFFLINE" | "DEGRADED";
    metadata?: Record<string, string>;
  }
}
