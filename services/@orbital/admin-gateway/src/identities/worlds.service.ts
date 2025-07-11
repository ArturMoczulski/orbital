import { Injectable, Logger } from "@nestjs/common";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class WorldsService {
  private readonly logger = new Logger(WorldsService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  async find(filter: Record<string, any> = {}): Promise<any[]> {
    const worlds = await this.worldMicroservice.worlds.find({
      filter,
      projection: {},
      options: {},
    });
    return Array.isArray(worlds) ? worlds : [];
  }

  async findById(_id: string): Promise<any> {
    const world = await this.worldMicroservice.worlds.findById({
      id: _id,
      projection: {},
    });
    if (!world) {
      throw new Error("World not found");
    }
    return world;
  }

  async findByShard(shard: string): Promise<any[]> {
    this.logger.log(`Finding worlds by shard: ${shard}`);
    const worlds = await this.worldMicroservice.worlds.findByShard({
      shard,
      projection: {},
      options: {},
    });
    return Array.isArray(worlds) ? worlds : [];
  }

  async findByTechLevel(techLevel: number): Promise<any[]> {
    this.logger.log(`Finding worlds by techLevel: ${techLevel}`);
    const worlds = await this.worldMicroservice.worlds.findByTechLevel({
      techLevel,
      projection: {},
      options: {},
    });
    return Array.isArray(worlds) ? worlds : [];
  }

  async create(body: any): Promise<any> {
    this.logger.log(`Creating world: ${JSON.stringify(body)}`);
    return this.worldMicroservice.worlds.create(body);
  }

  async update(_id: string, body: any): Promise<any> {
    return this.worldMicroservice.worlds.update({
      _id,
      ...body,
    });
  }

  async delete(_id: string): Promise<any> {
    return this.worldMicroservice.worlds.delete(_id);
  }
}
