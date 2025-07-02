import { Injectable } from "@nestjs/common";
import { Area, AreaProps } from "@orbital/core";
import { CRUDService } from "@orbital/nest";
import { AreasRepository } from "./areas.repository";

@Injectable()
export class AreasCRUDService extends CRUDService<
  Area,
  AreaProps,
  AreasRepository
> {
  constructor(areasRepository: AreasRepository) {
    super(areasRepository);
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
    return this.repository.findByWorldId(worldId, projection, options);
  }
}
