import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Microservice } from '@orbital/microservices';
import { Area, AreaProps, WithId, WithoutId, World } from '@orbital/core';
import { IdentityAccount } from '@orbital/identity-types';

/**
 * Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */


/**
 * Controller interfaces
 */

interface AreasController {
  create(dto: WithoutId<Area> | WithoutId<Area>[]): Promise<any | null>;
  find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<any | null>;
  findById(payload: { id: string; projection?: Record<string, any> }): Promise<any | null>;
  update(data: WithId<Area> | WithId<Area>[]): Promise<any | null>;
  delete(ids: string | string[]): Promise<any | null>;
  findByWorldId(payload: {
    worldId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Area[] | null>;
  findByParentId(payload: {
    parentId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Area[] | null>;
  findByTags(payload: {
    tags: string[];
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Area[] | null>;
}

interface IdentitiesController {
  create(dto: WithoutId<IdentityAccount> | WithoutId<IdentityAccount>[]): Promise<any | null>;
  find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<any | null>;
  findById(payload: { id: string; projection?: Record<string, any> }): Promise<any | null>;
  update(data: WithId<IdentityAccount> | WithId<IdentityAccount>[]): Promise<any | null>;
  delete(ids: string | string[]): Promise<any | null>;
  findByCharacterId(payload: {
    characterId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<IdentityAccount[] | null>;
}

interface WorldsController {
  create(dto: WithoutId<World> | WithoutId<World>[]): Promise<any | null>;
  find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<any | null>;
  findById(payload: { id: string; projection?: Record<string, any> }): Promise<any | null>;
  update(data: WithId<World> | WithId<World>[]): Promise<any | null>;
  delete(ids: string | string[]): Promise<any | null>;
  findByShard(payload: {
    shard: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<World[] | null>;
  findByTechLevel(payload: {
    techLevel: number;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<World[] | null>;
}

@Injectable()
export class WorldMicroservice extends Microservice {
  /**
   * areas controller proxy
   */
  public readonly areas: AreasController;
  /**
   * identities controller proxy
   */
  public readonly identities: IdentitiesController;
  /**
   * worlds controller proxy
   */
  public readonly worlds: WorldsController;

  constructor(@Inject('NATS_CLIENT') client: ClientProxy) {
    super(client, 'world');

    // Initialize areas controller
    this.areas = {
      create: async (dto: WithoutId<Area> | WithoutId<Area>[]) => {
        return this.request<any>('world.AreasMicroserviceController.create', dto);
      },
      find: async (payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        return this.request<any>('world.AreasMicroserviceController.find', payload);
      },
      findById: async (payload: { id: string; projection?: Record<string, any> }) => {
        return this.request<any>('world.AreasMicroserviceController.findById', payload);
      },
      update: async (data: WithId<Area> | WithId<Area>[]) => {
        return this.request<any>('world.AreasMicroserviceController.update', data);
      },
      delete: async (ids: string | string[]) => {
        return this.request<any>('world.AreasMicroserviceController.delete', ids);
      },
      findByWorldId: async (payload: {
    worldId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.findByWorldId', payload);
        return result || [];
      },
      findByParentId: async (payload: {
    parentId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.findByParentId', payload);
        return result || [];
      },
      findByTags: async (payload: {
    tags: string[];
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.findByTags', payload);
        return result || [];
      },
    };
    // Initialize identities controller
    this.identities = {
      create: async (dto: WithoutId<IdentityAccount> | WithoutId<IdentityAccount>[]) => {
        return this.request<any>('world.IdentitiesMicroserviceController.create', dto);
      },
      find: async (payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        return this.request<any>('world.IdentitiesMicroserviceController.find', payload);
      },
      findById: async (payload: { id: string; projection?: Record<string, any> }) => {
        return this.request<any>('world.IdentitiesMicroserviceController.findById', payload);
      },
      update: async (data: WithId<IdentityAccount> | WithId<IdentityAccount>[]) => {
        return this.request<any>('world.IdentitiesMicroserviceController.update', data);
      },
      delete: async (ids: string | string[]) => {
        return this.request<any>('world.IdentitiesMicroserviceController.delete', ids);
      },
      findByCharacterId: async (payload: {
    characterId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<IdentityAccount[]>('world.IdentitiesMicroserviceController.findByCharacterId', payload);
        return result || [];
      },
    };
    // Initialize worlds controller
    this.worlds = {
      create: async (dto: WithoutId<World> | WithoutId<World>[]) => {
        return this.request<any>('world.WorldsMicroserviceController.create', dto);
      },
      find: async (payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        return this.request<any>('world.WorldsMicroserviceController.find', payload);
      },
      findById: async (payload: { id: string; projection?: Record<string, any> }) => {
        return this.request<any>('world.WorldsMicroserviceController.findById', payload);
      },
      update: async (data: WithId<World> | WithId<World>[]) => {
        return this.request<any>('world.WorldsMicroserviceController.update', data);
      },
      delete: async (ids: string | string[]) => {
        return this.request<any>('world.WorldsMicroserviceController.delete', ids);
      },
      findByShard: async (payload: {
    shard: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<World[]>('world.WorldsMicroserviceController.findByShard', payload);
        return result || [];
      },
      findByTechLevel: async (payload: {
    techLevel: number;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<World[]>('world.WorldsMicroserviceController.findByTechLevel', payload);
        return result || [];
      },
    };
  }
}
