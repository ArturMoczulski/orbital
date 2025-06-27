import { Inject, Injectable } from "@nestjs/common";
import { CrudRepository } from "@orbital/nest";
import { AreaModel as Area } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class AreasRepository extends CrudRepository<Area> {
  constructor(
    @Inject(getModelToken("AreaModel"))
    areaModel: ReturnModelType<typeof Area>
  ) {
    super(areaModel);
  }

  /**
   * Find areas by parent ID
   * @param parentId The parent area ID or null for top-level areas
   * @returns Array of areas
   */
  async findByParentId(parentId: string | null): Promise<Area[]> {
    return this.find({ parentId });
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @returns Array of areas with any of the specified tags
   */
  async findByTags(tags: string[]): Promise<Area[]> {
    return this.find({ tags: { $in: tags } });
  }

  /**
   * Find areas by world ID
   * @param worldId The world ID
   * @returns Array of areas in the specified world
   */
  async findByWorldId(worldId: string): Promise<Area[]> {
    return this.find({ worldId });
  }
}
