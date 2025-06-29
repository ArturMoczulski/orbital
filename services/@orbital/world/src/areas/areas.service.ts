import { Injectable } from "@nestjs/common";
import { CrudService } from "@orbital/nest";
import { Area, WithDocument } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";

/**
 * Service for managing areas
 * Extends CrudService to inherit all standard CRUD operations
 * and adds domain-specific methods
 */
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
  async findByWorldId(worldId: string): Promise<WithDocument<Area>[]> {
    return this.repository.findByWorldId(worldId);
  }
}
