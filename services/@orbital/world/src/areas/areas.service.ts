import { Injectable } from "@nestjs/common";
import { CrudService } from "@orbital/nest";
import { AreaModel as Area } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";

@Injectable()
export class AreasService extends CrudService<Area, AreasRepository> {
  constructor(areasRepository: AreasRepository) {
    super(areasRepository);
  }

  /**
   * Get areas by world ID
   * @param worldId The world ID
   * @returns Array of areas in the specified world
   */
  async getAreasByWorldId(worldId: string): Promise<Area[]> {
    return this.repository.findByWorldId(worldId);
  }

  /**
   * Get areas by parent ID
   * @param parentId The parent area ID or null for top-level areas
   * @returns Array of areas
   */
  async getAreasByParentId(parentId: string | null): Promise<Area[]> {
    return this.repository.findByParentId(parentId);
  }

  /**
   * Get areas by tags
   * @param tags Array of tags to search for
   * @returns Array of areas with any of the specified tags
   */
  async getAreasByTags(tags: string[]): Promise<Area[]> {
    return this.repository.findByTags(tags);
  }
}
