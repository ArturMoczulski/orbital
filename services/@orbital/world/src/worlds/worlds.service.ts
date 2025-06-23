import { Injectable } from "@nestjs/common";
import { WorldsRepository } from "./worlds.repository";
import { WorldModel } from "./models/world.model";

@Injectable()
export class WorldsService {
  constructor(private readonly worldsRepository: WorldsRepository) {}

  async createWorld(dto: Partial<WorldModel>): Promise<WorldModel> {
    return this.worldsRepository.create(dto);
  }

  async getWorld(id: string): Promise<WorldModel | null> {
    return this.worldsRepository.findById(id);
  }

  async getAllWorlds(): Promise<WorldModel[]> {
    return this.worldsRepository.findAll();
  }
}
