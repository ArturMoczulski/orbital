import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Microservice } from '@orbital/microservices';
import { AreaModel } from '@orbital/typegoose';
import { Position } from '@orbital/core';

/**
 * DTO Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */

/**
 * Create Area DTO interface - for creating a new area
 */
export interface CreateAreaDto {
  name: string;
  description: string;
  position: Position;
  worldId: string;
  parentId?: string | null;
  landmarks?: string[];
  connections?: string[];
  tags?: string[];
}

/**
 * Update Area DTO interface - for updating an existing area
 */
export interface UpdateAreaDto {
  name?: string;
  description?: string;
  position?: Position;
  worldId?: string;
  parentId?: string | null;
  landmarks?: string[];
  connections?: string[];
  tags?: string[];
}


/**
 * Controller interfaces
 */

interface AreasController {
  createArea(createAreaDto: CreateAreaDto): Promise<AreaModel | null>;
  getAllAreas(): Promise<AreaModel[] | null>;
  getArea(id: string): Promise<AreaModel | null>;
  updateArea(payload: { id: string; updateDto: UpdateAreaDto }): Promise<AreaModel | null>;
  deleteArea(id: string): Promise<AreaModel | null>;
  getAreasByWorldId(worldId: string): Promise<AreaModel[] | null>;
  getAreasByParentId(parentId: string): Promise<AreaModel[] | null>;
  getAreasByTags(tags: string[]): Promise<AreaModel[] | null>;
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
      createArea: async (createAreaDto: CreateAreaDto) => {
        return this.request<AreaModel>('world.AreasMicroserviceController.createArea', createAreaDto);
      },
      getAllAreas: async () => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.getAllAreas');
        return result || [];
      },
      getArea: async (id: string) => {
        return this.request<AreaModel | null>('world.AreasMicroserviceController.getArea', id);
      },
      updateArea: async (payload: { id: string; updateDto: UpdateAreaDto }) => {
        return this.request<AreaModel | null>('world.AreasMicroserviceController.updateArea', payload);
      },
      deleteArea: async (id: string) => {
        return this.request<AreaModel | null>('world.AreasMicroserviceController.deleteArea', id);
      },
      getAreasByWorldId: async (worldId: string) => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.getAreasByWorldId', worldId);
        return result || [];
      },
      getAreasByParentId: async (parentId: string) => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.getAreasByParentId', parentId);
        return result || [];
      },
      getAreasByTags: async (tags: string[]) => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.getAreasByTags', tags);
        return result || [];
      },
    };
  }
}
