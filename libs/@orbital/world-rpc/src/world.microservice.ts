import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Microservice } from '@orbital/microservices';
import { AreaModel as Area, WithId, WithoutId, WorldModel as World } from '@orbital/typegoose';
import { BulkCountedResponse, BulkItemizedResponse } from '@scout/core';

/**
 * Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */


/**
 * Controller interfaces
 */

interface AreasController {
  create(createDto: Partial<WithoutId<Area>> | Partial<WithoutId<Area>>[]): Promise<Area | BulkItemizedResponse<Partial<WithoutId<Area>>, Area> | null>;
  find(): Promise<Area[] | null>;
  findById(_id: string): Promise<Area | null>;
  update(updateDto: WithId<Area> | WithId<Area>[]): Promise<Area | null | BulkItemizedResponse<WithId<Area>, Area>>;
  delete(ids: string | string[]): Promise<boolean | null | BulkCountedResponse>;
  findByWorldId(worldId: string): Promise<Area[] | null>;
  findByParentId(payload: { parentId: string; projection: Record<string, unknown>; options: Record<string, unknown> }): Promise<Area[] | null>;
  findByTags(tags: string[]): Promise<Area[] | null>;
}

interface WorldsController {
  create(createDto: Partial<WithoutId<World>> | Partial<WithoutId<World>>[]): Promise<World | BulkItemizedResponse<Partial<WithoutId<World>>, World> | null>;
  find(): Promise<World[] | null>;
  findById(_id: string): Promise<World | null>;
  update(updateDto: WithId<World> | WithId<World>[]): Promise<World | null | BulkItemizedResponse<WithId<World>, World>>;
  delete(ids: string | string[]): Promise<boolean | null | BulkCountedResponse>;
  findByShard(shard: string): Promise<World[] | null>;
  findByTechLevel(techLevel: number): Promise<World[] | null>;
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

  constructor(@Inject('NATS_CLIENT') client: ClientProxy) {
    super(client, 'world');

    // Initialize areas controller
    this.areas = {
      create: async (createDto: Partial<WithoutId<Area>> | Partial<WithoutId<Area>>[]) => {
        return this.request<Area | BulkItemizedResponse<Partial<WithoutId<Area>>, Area>>('world.AreasMicroserviceController.create', createDto);
      },
      find: async () => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.find');
        return result || [];
      },
      findById: async (_id: string) => {
        return this.request<Area | null>('world.AreasMicroserviceController.findById', _id);
      },
      update: async (updateDto: WithId<Area> | WithId<Area>[]) => {
        return this.request<Area | null | BulkItemizedResponse<WithId<Area>, Area>>('world.AreasMicroserviceController.update', updateDto);
      },
      delete: async (ids: string | string[]) => {
        return this.request<boolean | null | BulkCountedResponse>('world.AreasMicroserviceController.delete', ids);
      },
      findByWorldId: async (worldId: string) => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.findByWorldId', worldId);
        return result || [];
      },
      findByParentId: async (payload: { parentId: string; projection: Record<string, unknown>; options: Record<string, unknown> }) => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.findByParentId', payload);
        return result || [];
      },
      findByTags: async (tags: string[]) => {
        const result = await this.request<Area[]>('world.AreasMicroserviceController.findByTags', tags);
        return result || [];
      },
    };
    // Initialize worlds controller
    this.worlds = {
      create: async (createDto: Partial<WithoutId<World>> | Partial<WithoutId<World>>[]) => {
        return this.request<World | BulkItemizedResponse<Partial<WithoutId<World>>, World>>('world.WorldsMicroserviceController.create', createDto);
      },
      find: async () => {
        const result = await this.request<World[]>('world.WorldsMicroserviceController.find');
        return result || [];
      },
      findById: async (_id: string) => {
        return this.request<World | null>('world.WorldsMicroserviceController.findById', _id);
      },
      update: async (updateDto: WithId<World> | WithId<World>[]) => {
        return this.request<World | null | BulkItemizedResponse<WithId<World>, World>>('world.WorldsMicroserviceController.update', updateDto);
      },
      delete: async (ids: string | string[]) => {
        return this.request<boolean | null | BulkCountedResponse>('world.WorldsMicroserviceController.delete', ids);
      },
      findByShard: async (shard: string) => {
        const result = await this.request<World[]>('world.WorldsMicroserviceController.findByShard', shard);
        return result || [];
      },
      findByTechLevel: async (techLevel: number) => {
        const result = await this.request<World[]>('world.WorldsMicroserviceController.findByTechLevel', techLevel);
        return result || [];
      },
    };
  }
}
