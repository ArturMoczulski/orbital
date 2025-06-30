import { Injectable, Logger } from "@nestjs/common";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class AreasService {
  private readonly logger = new Logger(AreasService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  async getAll(): Promise<any[]> {
    const areas = await this.worldMicroservice.areas.find({
      filter: {},
      projection: {},
      options: {},
    });
    return Array.isArray(areas) ? areas : [];
  }

  async getById(_id: string): Promise<any> {
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
