import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { WithoutId } from "@orbital/core";
import { Microservice } from "@orbital/microservices";
import { AreaModel, WithId, WorldModel } from "@orbital/typegoose";

/**
 * Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */

/**
 * Controller interfaces
 */

interface AreasController {
  create(
    dto: WithoutId<AreaModel> | WithoutId<AreaModel>[]
  ): Promise<any | null>;
  find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<any | null>;
  findById(payload: {
    id: string;
    projection?: Record<string, any>;
  }): Promise<any | null>;
  update(data: WithId<AreaModel> | WithId<AreaModel>[]): Promise<any | null>;
  delete(ids: string | string[]): Promise<any | null>;
  findByWorldId(payload: {
    worldId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<AreaModel[] | null>;
  findByParentId(payload: {
    parentId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<AreaModel[] | null>;
  findByTags(payload: {
    tags: string[];
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<AreaModel[] | null>;
}

interface WorldsController {
  create(
    dto: WithoutId<WorldModel> | WithoutId<WorldModel>[]
  ): Promise<any | null>;
  find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<any | null>;
  findById(payload: {
    id: string;
    projection?: Record<string, any>;
  }): Promise<any | null>;
  update(data: WithId<WorldModel> | WithId<WorldModel>[]): Promise<any | null>;
  delete(ids: string | string[]): Promise<any | null>;
  findByShard(payload: {
    shard: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<WorldModel[] | null>;
  findByTechLevel(payload: {
    techLevel: number;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<WorldModel[] | null>;
}

@Injectable()
export class WorldMicroservice extends Microservice {
  /**
   * areas controller proxy
   */
  public readonly areas: AreasController;

  /**
   * worlds controller proxy
   */
  public readonly worlds: WorldsController;

  constructor(@Inject("NATS_CLIENT") client: ClientProxy) {
    super(client, "world");

    // Initialize areas controller
    this.areas = {
      create: async (dto: WithoutId<AreaModel> | WithoutId<AreaModel>[]) => {
        return this.request<any>(
          "world.AreasMicroserviceController.create",
          dto
        );
      },
      find: async (payload: {
        filter?: Record<string, any>;
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        return this.request<any>(
          "world.AreasMicroserviceController.find",
          payload
        );
      },
      findById: async (payload: {
        id: string;
        projection?: Record<string, any>;
      }) => {
        return this.request<any>(
          "world.AreasMicroserviceController.findById",
          payload
        );
      },
      update: async (data: WithId<AreaModel> | WithId<AreaModel>[]) => {
        return this.request<any>(
          "world.AreasMicroserviceController.update",
          data
        );
      },
      delete: async (ids: string | string[]) => {
        return this.request<any>(
          "world.AreasMicroserviceController.delete",
          ids
        );
      },
      findByWorldId: async (payload: {
        worldId: string;
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        const result = await this.request<AreaModel[]>(
          "world.AreasMicroserviceController.findByWorldId",
          payload
        );
        return result || [];
      },
      findByParentId: async (payload: {
        parentId: string;
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        const result = await this.request<AreaModel[]>(
          "world.AreasMicroserviceController.findByParentId",
          payload
        );
        return result || [];
      },
      findByTags: async (payload: {
        tags: string[];
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        const result = await this.request<AreaModel[]>(
          "world.AreasMicroserviceController.findByTags",
          payload
        );
        return result || [];
      },
    };

    // Initialize worlds controller
    this.worlds = {
      create: async (dto: WithoutId<WorldModel> | WithoutId<WorldModel>[]) => {
        return this.request<any>(
          "world.WorldsMicroserviceController.create",
          dto
        );
      },
      find: async (payload: {
        filter?: Record<string, any>;
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        return this.request<any>(
          "world.WorldsMicroserviceController.find",
          payload
        );
      },
      findById: async (payload: {
        id: string;
        projection?: Record<string, any>;
      }) => {
        return this.request<any>(
          "world.WorldsMicroserviceController.findById",
          payload
        );
      },
      update: async (data: WithId<WorldModel> | WithId<WorldModel>[]) => {
        return this.request<any>(
          "world.WorldsMicroserviceController.update",
          data
        );
      },
      delete: async (ids: string | string[]) => {
        return this.request<any>(
          "world.WorldsMicroserviceController.delete",
          ids
        );
      },
      findByShard: async (payload: {
        shard: string;
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        const result = await this.request<WorldModel[]>(
          "world.WorldsMicroserviceController.findByShard",
          payload
        );
        return result || [];
      },
      findByTechLevel: async (payload: {
        techLevel: number;
        projection?: Record<string, any>;
        options?: Record<string, any>;
      }) => {
        const result = await this.request<WorldModel[]>(
          "world.WorldsMicroserviceController.findByTechLevel",
          payload
        );
        return result || [];
      },
    };
  }
}
