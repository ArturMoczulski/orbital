import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Microservice } from '@orbital/microservices';
import { WithoutId } from '@orbital/core';
import { AreaModel, WithId } from '@orbital/typegoose';

/**
 * Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */


/**
 * Controller interfaces
 */

interface AreasController {
  create(dto: WithoutId<AreaModel> | WithoutId<AreaModel>[]): Promise<any | null>;
  find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<any | null>;
  findById(payload: { id: string; projection?: Record<string, any> }): Promise<any | null>;
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

@Injectable()
export class WorldMicroservice extends Microservice {
  /**
   * areas controller proxy
   */
  public readonly areas: AreasController;

  constructor(@Inject('NATS_CLIENT') client: ClientProxy) {
    super(client, 'world');

    // Initialize areas controller
    this.areas = {
      create: async (dto: WithoutId<AreaModel> | WithoutId<AreaModel>[]) => {
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
      update: async (data: WithId<AreaModel> | WithId<AreaModel>[]) => {
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
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.findByWorldId', payload);
        return result || [];
      },
      findByParentId: async (payload: {
    parentId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.findByParentId', payload);
        return result || [];
      },
      findByTags: async (payload: {
    tags: string[];
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.findByTags', payload);
        return result || [];
      },
    };
  }
}
