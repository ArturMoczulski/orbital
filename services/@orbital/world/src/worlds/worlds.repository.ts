import { Inject, Injectable } from "@nestjs/common";
import { World } from "@orbital/core";
import { DocumentRepository } from "@orbital/typegoose";
import { WorldModel } from "@orbital/world-typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

// Define WorldProps locally based on WorldModel properties
export type WorldProps = {
  _id: string;
  name: string;
  shard: string;
  techLevel: number;
  locations?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class WorldsRepository extends DocumentRepository<
  WorldModel,
  WorldProps,
  typeof WorldModel
> {
  constructor(
    @Inject(getModelToken(WorldModel.name))
    worldModel: ReturnModelType<typeof WorldModel>
  ) {
    // Call super with the required arguments
    super(worldModel, WorldModel);
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
  ): Promise<World[]> {
    return this.find({ shard }, projection, options);
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
  ): Promise<World[]> {
    return this.find({ techLevel }, projection, options);
  }
}
