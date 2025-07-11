import { Injectable, Logger } from "@nestjs/common";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  async find(filter: Record<string, any> = {}): Promise<any[]> {
    const characters = await (this.worldMicroservice as any).characters.find({
      filter,
      projection: {},
      options: {},
    });
    return Array.isArray(characters) ? characters : [];
  }

  async findById(_id: string): Promise<any> {
    const character = await (this.worldMicroservice as any).characters.findById(
      {
        id: _id,
        projection: {},
      }
    );
    if (!character) {
      throw new Error("Character not found");
    }
    return character;
  }

  async findByLocationId(locationId: string): Promise<any[]> {
    this.logger.log(`Finding characters by locationId: ${locationId}`);
    const characters = await (
      this.worldMicroservice as any
    ).characters.findByLocationId({
      locationId,
      projection: {},
      options: {},
    });
    return Array.isArray(characters) ? characters : [];
  }

  async findByWorldId(worldId: string): Promise<any[]> {
    this.logger.log(`Finding characters by worldId: ${worldId}`);
    const characters = await (
      this.worldMicroservice as any
    ).characters.findByWorldId({
      worldId,
      projection: {},
      options: {},
    });
    return Array.isArray(characters) ? characters : [];
  }

  async create(body: any): Promise<any> {
    this.logger.log(`Creating character: ${JSON.stringify(body)}`);
    return (this.worldMicroservice as any).characters.create(body);
  }

  async update(_id: string, body: any): Promise<any> {
    return (this.worldMicroservice as any).characters.update({
      _id,
      ...body,
    });
  }

  async delete(_id: string): Promise<any> {
    return (this.worldMicroservice as any).characters.delete(_id);
  }
}
