import { Injectable, Logger } from "@nestjs/common";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class AreasService {
  private readonly logger = new Logger(AreasService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  async find(filter: Record<string, any> = {}): Promise<any[]> {
    // TODO: Update this method to use separate parameters once the RPC client is updated
    const areas = await this.worldMicroservice.areas.find({
      filter,
      projection: {},
      options: {},
    });
    return Array.isArray(areas) ? areas : [];
  }

  async findByWorldId(worldId: string): Promise<any[]> {
    this.logger.log(`Finding areas by worldId: ${worldId}`);
    const areas = await this.worldMicroservice.areas.findByWorldId({
      worldId,
      projection: {},
      options: {},
    });
    return Array.isArray(areas) ? areas : [];
  }

  async findById(_id: string): Promise<any> {
    const area = await this.worldMicroservice.areas.findById({
      id: _id,
      projection: {},
    });
    if (!area) {
      throw new Error("Area not found");
    }
    return area;
  }

  async create(body: any): Promise<any> {
    // Pass the body directly without adding defaults
    this.logger.log(`Creating area: ${JSON.stringify(body)}`);
    return this.worldMicroservice.areas.create(body);
  }

  async update(_id: string, body: any): Promise<any> {
    return this.worldMicroservice.areas.update({
      _id,
      ...body,
    });
  }

  async delete(_id: string): Promise<any> {
    return this.worldMicroservice.areas.delete(_id);
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
