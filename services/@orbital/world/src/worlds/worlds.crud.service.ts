import { Injectable } from "@nestjs/common";
import { CRUDService } from "@orbital/nest";
import { WorldModel } from "@orbital/typegoose";
import { WorldProps, WorldsRepository } from "./worlds.repository";

@Injectable()
export class WorldsCRUDService extends CRUDService<
  WorldModel,
  WorldProps,
  WorldsRepository
> {
  constructor(worldsRepository: WorldsRepository) {
    super(worldsRepository);
  }

  /**
   * Find worlds by shard
   * @param shard The shard identifier
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of worlds in the specified shard
   */
  async findByShard(
    shard: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<WorldModel[]> {
    return this.repository.findByShard(shard, projection, options);
  }

  /**
   * Find worlds by tech level
   * @param techLevel The tech level to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of worlds with the specified tech level
   */
  async findByTechLevel(
    techLevel: number,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<WorldModel[]> {
    return this.repository.findByTechLevel(techLevel, projection, options);
  }
}
