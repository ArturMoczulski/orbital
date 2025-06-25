import { Injectable, Logger } from "@nestjs/common";
import { AreaMap } from "@orbital/core/src/types/area-map";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class AreasService {
  private readonly logger = new Logger(AreasService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  async getAll(): Promise<any[]> {
    const areas = await this.worldMicroservice.areas.getAllAreas();
    return Array.isArray(areas) ? areas : [];
  }

  async getById(id: string): Promise<any> {
    return this.worldMicroservice.areas.getArea(id);
  }

  async create(body: any): Promise<any> {
    // Ensure required fields are present
    const areaData = {
      ...body,
      // Ensure position is present
      position: body.position || { x: 0, y: 0, z: 0 },
      // Ensure description is present (required by database model)
      description: body.description || "",
      // Ensure worldId is present if not provided
      worldId: body.worldId || "default",
      // Ensure _id is present if not provided
      _id: body.id || body._id,
      // Ensure name is present (required by database model)
      name: body.name || "New Area",
    };

    this.logger.log(`Creating area: ${JSON.stringify(areaData)}`);
    return this.worldMicroservice.areas.createArea(areaData);
  }

  async update(id: string, body: any): Promise<any> {
    return this.worldMicroservice.areas.updateArea({ id, updateDto: body });
  }

  async delete(id: string): Promise<any> {
    return this.worldMicroservice.areas.deleteArea(id);
  }

  async getMap(id: string): Promise<any> {
    // TODO: When the world microservice adds a getMap method, use it here:
    // return await this.worldMicroservice.areas.getMap(id);

    // For now, generate a mock map
    const width = 64;
    const height = 64;
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => Math.floor(Math.random() * 8))
    );

    this.logger.log(`getMap id=${id} width=${width} height=${height}`);
    return { id, width, height, grid };
  }
}
