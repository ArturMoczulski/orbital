import { Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Microservice } from "@orbital/microservices";

/**
 * World microservice proxy
 * Provides type-safe access to the World microservice
 */
@Injectable()
export class WorldMicroservice extends Microservice {
  constructor(client: ClientProxy) {
    super(client, "world");
  }

  /**
   * Get all areas
   */
  async getAllAreas() {
    return this.request("world.AreasMicroserviceController.getAllAreas");
  }

  /**
   * Get area by ID
   */
  async getArea(id: string) {
    return this.request("world.AreasMicroserviceController.getArea", id);
  }

  /**
   * Create a new area
   */
  async createArea(createAreaDto: any) {
    return this.request(
      "world.AreasMicroserviceController.createArea",
      createAreaDto
    );
  }

  /**
   * Update an area
   */
  async updateArea(id: string, updateAreaDto: any) {
    return this.request("world.AreasMicroserviceController.updateArea", {
      id,
      updateAreaDto,
    });
  }

  /**
   * Delete an area
   */
  async deleteArea(id: string) {
    return this.request("world.AreasMicroserviceController.deleteArea", id);
  }

  /**
   * Get areas by world ID
   */
  async getAreasByWorldId(worldId: string) {
    return this.request(
      "world.AreasMicroserviceController.getAreasByWorldId",
      worldId
    );
  }

  /**
   * Get areas by parent ID
   */
  async getAreasByParentId(parentId: string | null) {
    return this.request(
      "world.AreasMicroserviceController.getAreasByParentId",
      parentId
    );
  }

  /**
   * Get areas by tags
   */
  async getAreasByTags(tags: string[]) {
    return this.request(
      "world.AreasMicroserviceController.getAreasByTags",
      tags
    );
  }
}
