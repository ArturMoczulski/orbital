import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Microservice } from '@orbital/microservices';
import { AreaModel } from '@orbital/typegoose';
import { Area } from '@orbital/core';

/**
 * Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */


/**
 * Controller interfaces
 */

interface AreasController {
  createArea(createAreaData: Partial<Area>): Promise<AreaModel | null>;
  getAllAreas(): Promise<AreaModel[] | null>;
  getArea(_id: string): Promise<AreaModel | null>;
  updateArea(updateAreaData: Partial<Area>): Promise<AreaModel | null>;
  deleteArea(_id: string): Promise<AreaModel | null>;
  getAreasByWorldId(worldId: string): Promise<AreaModel[] | null>;
  getAreasByParentId(parentId: string | null): Promise<AreaModel[] | null>;
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
      createArea: async (createAreaData: Partial<Area>) => {
        return this.request<AreaModel>('world.AreasMicroserviceController.createArea', createAreaData);
      },
      getAllAreas: async () => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.getAllAreas');
        return result || [];
      },
      getArea: async (_id: string) => {
        return this.request<AreaModel | null>('world.AreasMicroserviceController.getArea', _id);
      },
      updateArea: async (updateAreaData: Partial<Area>) => {
        return this.request<AreaModel | null>('world.AreasMicroserviceController.updateArea', updateAreaData);
      },
      deleteArea: async (_id: string) => {
        return this.request<AreaModel | null>('world.AreasMicroserviceController.deleteArea', _id);
      },
      getAreasByWorldId: async (worldId: string) => {
        const result = await this.request<AreaModel[]>('world.AreasMicroserviceController.getAreasByWorldId', worldId);
        return result || [];
      },
      getAreasByParentId: async (parentId: string | null) => {
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
