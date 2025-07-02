import { Inject, Injectable } from "@nestjs/common";
import { Area, AreaProps } from "@orbital/core";
import {
  AreaModel,
  DocumentRepository,
  ModelReferences,
  WorldModel,
} from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class AreasRepository extends DocumentRepository<
  Area,
  AreaProps,
  typeof AreaModel
> {
  constructor(
    @Inject(getModelToken(AreaModel.name))
    areaModel: ReturnModelType<typeof AreaModel>,
    @Inject(getModelToken(WorldModel.name))
    worldModel: ReturnModelType<typeof WorldModel>
  ) {
    // Create model references object
    const modelReferences: ModelReferences = {
      world: worldModel,
      area: areaModel, // Add self-reference for parentId validation
    };

    // Call super with the required arguments
    super(areaModel, AreaModel, modelReferences);
  }

  /**
   * Find areas by world ID
   * @param worldId The world ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas in the specified world
   */
  async findByWorldId(
    worldId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Area[]> {
    return this.find({ worldId }, projection, options);
  }

  /**
   * Find areas by parent ID
   * @param parentId The parent area ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of child areas
   */
  async findByParentId(
    parentId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Area[]> {
    return this.find({ parentId }, projection, options);
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas with matching tags
   */
  async findByTags(
    tags: string[],
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Area[]> {
    return this.find({ tags: { $in: tags } }, projection, options);
  }
}
