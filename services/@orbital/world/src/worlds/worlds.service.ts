import { Injectable } from "@nestjs/common";
import { CrudService } from "@orbital/nest";
import { WithDocument, WorldModel as World } from "@orbital/typegoose";
import { WorldsRepository } from "./worlds.repository";

/**
 * Service for managing worlds
 * Extends CrudService to inherit all standard CRUD operations
 * and adds domain-specific methods
 */
@Injectable()
export class WorldsService extends CrudService<World, WorldsRepository> {
  constructor(worldsRepository: WorldsRepository) {
    super(worldsRepository);
  }

  /**
   * Find worlds by shard
   * @param shard The shard identifier
   * @returns Array of worlds in the specified shard
   */
  async findByShard(shard: string): Promise<WithDocument<World>[]> {
    return this.repository.findByShard(shard);
  }

  /**
   * Find worlds by technology level
   * @param techLevel The technology level
   * @returns Array of worlds with the specified technology level
   */
  async findByTechLevel(techLevel: number): Promise<WithDocument<World>[]> {
    return this.repository.findByTechLevel(techLevel);
  }
}
