import { Inject, Injectable } from "@nestjs/common";
import { AreaProps } from "@orbital/core";
import { Area, DocumentRepository, WithDocument } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class AreasRepository extends DocumentRepository<
  Area,
  AreaProps,
  typeof Area
> {
  constructor(
    @Inject(getModelToken(Area.name))
    areaModel: ReturnModelType<typeof Area>
  ) {
    // Call super with the required arguments
    super(areaModel, Area);
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
  ): Promise<WithDocument<Area>[]> {
    return this.find({ worldId }, projection, options);
  }
}
