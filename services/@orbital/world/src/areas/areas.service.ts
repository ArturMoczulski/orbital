import { Injectable } from "@nestjs/common";
import { CrudService } from "@orbital/nest";
import { Area } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";

@Injectable()
export class AreasService extends CrudService<Area, AreasRepository> {
  constructor(areasRepository: AreasRepository) {
    super(areasRepository);
  }

  /**
   * Find areas by world ID
   * @param worldId The world ID
   * @returns Array of areas in the specified world
   */
  async findByWorldId(worldId: string): Promise<Area[]> {
    return this.repository.findByWorldId(worldId);
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @returns Array of areas with any of the specified tags
   */
  async findByTags(tags: string[]): Promise<Area[]> {
    return this.repository.findByTags(tags);
  }
}
