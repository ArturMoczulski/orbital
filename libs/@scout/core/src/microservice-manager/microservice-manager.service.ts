// intervals-registry.ts

import {
  Global,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ClientProxy } from "@nestjs/microservices";
import { Microservice } from "../nest/microservice";
import {
  SingletonInterval,
  SingletonIntervalService,
} from "../singleton-interval";

export enum ScoutMicroservices {
  API = "api",
  ContentManagement = "content-management",
  JobsQueue = "jobs-queue",
  Prospects = "prospects",
  Products = "products",
  ContentGeneration = "content-generation",
  Campaigns = "campaigns",
}

export enum MicroserviceManagerEvents {
  Unavailable = "microservice.unavailable",
  Available = "microservice.available",
}

@Global()
@Injectable()
export class MicroserviceManagerService
  extends Microservice
  implements OnModuleInit
{
  protected logger: Logger = new Logger(MicroserviceManagerService.name);
  protected registry: ScoutMicroservices[] = [];
  static HEALTHCHECK_FREQUENCY = 3 * 1000;
  private readonly statusMap: Partial<Record<ScoutMicroservices, boolean>> = {};

  constructor(
    @Inject("NATS_SERVER") clientProxy: ClientProxy,
    private readonly eventEmitter: EventEmitter2
  ) {
    super(clientProxy, undefined);
  }

  register(microservice: ScoutMicroservices) {
    if (!this.registry.includes(microservice)) {
      this.registry.push(microservice);
    }
  }

  registerScoutMicroservices() {
    for (const microservice of Object.values(ScoutMicroservices)) {
      this.register(microservice);
    }
  }
  onModuleInit() {
    this.registerScoutMicroservices();
    SingletonIntervalService.isMicroserviceResponsive =
      this.healthCheck.bind(this);
  }

  /**
   * Periodic health-check for all registered microservices.
   */
  @SingletonInterval(MicroserviceManagerService.HEALTHCHECK_FREQUENCY)
  async checkAllMicroservices(): Promise<void> {
    if (!this.registry) return;

    for (const name of this.registry) {
      const prev = this.statusMap[name];
      let ok: boolean;
      try {
        ok = await this.healthCheck(name);
      } catch {
        ok = false;
      }
      // initialize or state changed
      if (prev === undefined) {
        this.statusMap[name] = ok;
      } else if (ok !== prev) {
        const event = ok
          ? MicroserviceManagerEvents.Available
          : MicroserviceManagerEvents.Unavailable;
        this.eventEmitter.emit(event, { microservice: name });
        this.statusMap[name] = ok;
      }
    }
  }

  async healthCheck(microservice: ScoutMicroservices): Promise<boolean> {
    if (!this.registry.includes(microservice)) {
      throw new Error(`Microservice ${microservice} not registered`);
    }
    try {
      const response = await this.request<string>(
        `${microservice}-health-check`
      );
      return response === "ok";
    } catch {
      return false;
    }
  }
}
