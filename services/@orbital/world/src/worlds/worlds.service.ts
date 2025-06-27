import { Injectable } from "@nestjs/common";
import { CrudService } from "@orbital/nest";
import { WorldModel as World } from "@orbital/typegoose";
import { WorldsRepository } from "./worlds.repository";

@Injectable()
export class WorldsService extends CrudService<World, WorldsRepository> {
  constructor(worldsRepository: WorldsRepository) {
    super(worldsRepository);
  }

  /**
   * Create a new world
   * @param data Partial world data
   * @returns The created world
   */
  async createWorld(data: Partial<World>): Promise<World> {
    return this.create(data);
  }

  /**
   * Get a world by ID
   * @param _id The world ID
   * @returns The world or null
   */
  async getWorld(_id: string): Promise<World | null> {
    return this.getById(_id);
  }

  /**
   * Get all worlds matching a filter
   * @param filter Optional filter criteria
   * @param projection Optional projection
   * @returns Array of worlds
   */
  async getAllWorlds(
    filter: Record<string, any> = {},
    projection?: any
  ): Promise<World[]> {
    return this.repository.findAll(filter, projection);
  }

  /**
   * Update a world
   * @param _id The world ID
   * @param updateData Partial world data for update
   * @returns The updated world or null
   */
  async updateWorld(
    _id: string,
    updateData: Partial<World>
  ): Promise<World | null> {
    return this.update(_id, updateData);
  }

  /**
   * Delete a world
   * @param _id The world ID
   * @returns The deleted world or null
   */
  async deleteWorld(_id: string): Promise<World | null> {
    return this.delete(_id);
  }

  /**
   * Get worlds by shard
   * @param shard The shard identifier
   * @returns Array of worlds in the specified shard
   */
  async getWorldsByShard(shard: string): Promise<World[]> {
    return this.repository.findByShard(shard);
  }

  /**
   * Get worlds by technology level
   * @param techLevel The technology level
   * @returns Array of worlds with the specified technology level
   */
  async getWorldsByTechLevel(techLevel: number): Promise<World[]> {
    return this.repository.findByTechLevel(techLevel);
  }
}
