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
   * Create a new area
   * @param data Partial area data
   * @returns The created area
   */
  async createArea(data: Partial<Area>): Promise<Area> {
    return this.create(data);
  }

  /**
   * Get an area by ID
   * @param _id The area ID
   * @returns The area or null
   */
  async getArea(_id: string): Promise<Area | null> {
    return this.getById(_id);
  }

  /**
   * Get all areas matching a filter
   * @param filter Optional filter criteria
   * @param projection Optional projection
   * @returns Array of areas
   */
  async getAllAreas(
    filter: Record<string, any> = {},
    projection?: any
  ): Promise<Area[]> {
    return this.repository.findAll(filter, projection);
  }

  /**
   * Update an area
   * @param _id The area ID
   * @param updateData Partial area data for update
   * @returns The updated area or null
   */
  async updateArea(
    _id: string,
    updateData: Partial<Area>
  ): Promise<Area | null> {
    return this.update(_id, updateData);
  }

  /**
   * Delete an area
   * @param _id The area ID
   * @returns The deleted area or null
   */
  async deleteArea(_id: string): Promise<Area | null> {
    return this.delete(_id);
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
