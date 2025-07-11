import { Injectable, Logger } from "@nestjs/common";
import { WorldMicroservice } from "@orbital/world-rpc";

@Injectable()
export class IdentitiesService {
  private readonly logger = new Logger(IdentitiesService.name);

  constructor(private readonly worldMicroservice: WorldMicroservice) {}

  async find(filter: Record<string, any> = {}): Promise<any[]> {
    // Use type assertion to tell TypeScript that identities property exists
    const identities = await (this.worldMicroservice as any).identities.find({
      filter,
      projection: {},
      options: {},
    });
    return Array.isArray(identities) ? identities : [];
  }

  async findById(_id: string): Promise<any> {
    const identity = await (this.worldMicroservice as any).identities.findById({
      id: _id,
      projection: {},
    });
    if (!identity) {
      throw new Error("Identity account not found");
    }
    return identity;
  }

  async findByCharacterId(characterId: string): Promise<any[]> {
    this.logger.log(`Finding identity accounts by characterId: ${characterId}`);
    const identities = await (
      this.worldMicroservice as any
    ).identities.findByCharacterId({
      characterId,
      projection: {},
      options: {},
    });
    return Array.isArray(identities) ? identities : [];
  }

  async create(body: any): Promise<any> {
    this.logger.log(`Creating identity account: ${JSON.stringify(body)}`);
    return (this.worldMicroservice as any).identities.create(body);
  }

  async update(_id: string, body: any): Promise<any> {
    return (this.worldMicroservice as any).identities.update({
      _id,
      ...body,
    });
  }

  async delete(_id: string): Promise<any> {
    return (this.worldMicroservice as any).identities.delete(_id);
  }
}
