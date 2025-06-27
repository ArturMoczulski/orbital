import { Inject, Injectable } from "@nestjs/common";
import { AreaSchema } from "@orbital/core";
import { CrudRepository } from "@orbital/nest";
import { AreaModel as Area } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class AreasRepository extends CrudRepository<Area> {
  constructor(
    @Inject(getModelToken("Area"))
    areaModel: ReturnModelType<typeof Area>
  ) {
    super(areaModel, AreaSchema);
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
