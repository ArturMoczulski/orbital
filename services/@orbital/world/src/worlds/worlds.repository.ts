import { Inject, Injectable } from "@nestjs/common";
import { WorldSchema } from "@orbital/core";
import { CrudRepository } from "@orbital/nest";
import { WorldModel as World } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class WorldsRepository extends CrudRepository<World> {
  constructor(
    @Inject(getModelToken("World"))
    worldModel: ReturnModelType<typeof World>
  ) {
    super(worldModel, WorldSchema);
  }

  /**
   * Find worlds by shard
   * @param shard The shard identifier
   * @returns Array of worlds in the specified shard
   */
  async findByShard(shard: string): Promise<World[]> {
    return this.find({ shard });
  }

  /**
   * Find worlds by technology level
   * @param techLevel The technology level
   * @returns Array of worlds with the specified technology level
   */
  async findByTechLevel(techLevel: number): Promise<World[]> {
    return this.find({ techLevel });
  }
}
