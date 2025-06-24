import { Injectable, Logger } from "@nestjs/common";
import { AreaMap } from "@orbital/core/src/types/area-map";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class AreasService {
  private readonly logger = new Logger(AreasService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  /**
   * Get all areas from the world microservice
   */
  async getAll(): Promise<any[]> {
    const areas = await this.worldMicroservice.areas.getAllAreas();
    return Array.isArray(areas) ? areas : [];
  }

  /**
   * Get a single area by ID from the world microservice
   */
  async getById(id: string): Promise<any> {
    return this.worldMicroservice.areas.getArea(id);
  }

  /**
   * Create a new area using the world microservice
   */
  async create(body: any): Promise<any> {
    return this.worldMicroservice.areas.createArea(body);
  }

  /**
   * Update an area using the world microservice
   */
  async update(id: string, body: any): Promise<any> {
    return this.worldMicroservice.areas.updateArea({
      id,
      updateDto: body,
    });
  }

  /**
   * Delete an area using the world microservice
   */
  async delete(id: string): Promise<any> {
    return this.worldMicroservice.areas.deleteArea(id);
  }

  /**
   * Get map data for a specific area
   * Currently returns a mock map since the microservice doesn't have this method yet
   */
  async getMap(id: string): Promise<any> {
    // TODO: When the world microservice adds a getMap method, use it here:
    // return await this.worldMicroservice.areas.getMap(id);

    // For now, generate a mock map
    const width = 64;
    const height = 64;

    // Generate randomized grid
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => {
        // Generate a random number between 0 and 7 (inclusive)
        return Math.floor(Math.random() * 8);
      })
    );

    this.logger.log(`getMap id=${id} width=${width} height=${height}`);
    return { id, width, height, grid };
  }
}
