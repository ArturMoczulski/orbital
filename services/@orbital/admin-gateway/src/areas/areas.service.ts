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

  async getById(_id: string): Promise<any> {
    const area = await this.worldMicroservice.areas.getArea(_id);
    if (!area) {
      throw new Error("Area not found");
    }
    return area;
  }

  async create(body: any): Promise<any> {
    // Ensure required fields are present
    const areaData = {
      ...body,
      // Ensure position is present
      position: body.position || { x: 0, y: 0, z: 0 },
      // Ensure description is present (optional in database model now)
      description: body.description || "",
      // Ensure worldId is present if not provided (optional in database model now)
      worldId: body.worldId || "default",
      // Ensure name is present (required by database model)
      name: body.name || "New Area",
    };

    // Note: _id is now optional with a default value in the model
    // We don't need to explicitly set it here anymore

    this.logger.log(`Creating area: ${JSON.stringify(areaData)}`);
    return this.worldMicroservice.areas.createArea(areaData);
  }

  async update(_id: string, body: any): Promise<any> {
    return this.worldMicroservice.areas.updateArea({
      _id,
      updateDto: body,
    });
  }

  async delete(_id: string): Promise<any> {
    return this.worldMicroservice.areas.deleteArea(_id);
  }

  async getMap(_id: string): Promise<any> {
    // TODO: When the world microservice adds a getMap method, use it here:
    // return await this.worldMicroservice.areas.getMap(_id);

    // For now, generate a mock map
    const width = 64;
    const height = 64;
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => Math.floor(Math.random() * 8))
    );

    this.logger.log(`getMap _id=${_id} width=${width} height=${height}`);
    return { _id, width, height, grid };
  }
}
