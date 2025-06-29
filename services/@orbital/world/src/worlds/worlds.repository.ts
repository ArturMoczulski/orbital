import { Inject, Injectable } from "@nestjs/common";
import {
  DocumentRepository,
  WithDocument,
  WithoutId,
  WorldModel as World,
} from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class WorldsRepository extends DocumentRepository<
  World,
  WithoutId<World>,
  typeof World
> {
  constructor(
    @Inject(getModelToken("World"))
    worldModel: ReturnModelType<typeof World>
  ) {
    // Call super with the required arguments
    super(worldModel, World);
  }

  /**
   * Find worlds by shard
   * @param shard The shard identifier
   * @returns Array of worlds in the specified shard
   */
  async findByShard(shard: string): Promise<WithDocument<World>[]> {
    return this.find({ shard });
  }

  /**
   * Find worlds by technology level
   * @param techLevel The technology level
   * @returns Array of worlds with the specified technology level
   */
  async findByTechLevel(techLevel: number): Promise<WithDocument<World>[]> {
    return this.find({ techLevel });
  }
}
