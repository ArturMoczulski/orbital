import { Inject, Injectable } from "@nestjs/common";
import { Area, DocumentRepository, WithDocument } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

// Define AreaProps locally based on Area properties
export type AreaProps = {
  _id: string;
  name: string;
  worldId: string;
  description: string;
  landmarks: string[];
  connections: string[];
  tags: string[];
  parentId?: string | null;
  position?: { x: number; y: number; z: number };
  areaMap?: any;
  createdAt?: Date;
  updatedAt?: Date;
};

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
  ): Promise<WithDocument<Area>[]> {
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
  ): Promise<WithDocument<Area>[]> {
    return this.find({ tags: { $in: tags } }, projection, options);
  }
}
