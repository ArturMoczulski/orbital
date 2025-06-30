import { Injectable } from "@nestjs/common";
import { BulkCountedResponse } from "@orbital/bulk-operations";
import { Area } from "@orbital/typegoose";
import { AreasCRUDService } from "./areas.crud.service";

/**
 * Service for managing Areas
 * This service is a composition that uses AreasCRUDService internally
 * and proxies its methods
 */
@Injectable()
export class AreaService {
  /**
   * Constructor for the AreaService
   * @param areasCrudService The AreasCRUDService instance
   */
  constructor(private readonly areasCrudService: AreasCRUDService) {}

  /**
   * Create one or more areas
   * @param dto Single area or array of areas to create
   * @returns The created area or BulkItemizedResponse for multiple areas
   */
  async create(dto: Parameters<AreasCRUDService["create"]>[0]) {
    return this.areasCrudService.create(dto);
  }

  /**
   * Find areas by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas matching the query
   */
  async find(...args: Parameters<AreasCRUDService["find"]>) {
    return this.areasCrudService.find(...args);
  }

  /**
   * Find an area by ID
   * @param id The area ID
   * @param projection Optional fields to project
   * @returns The found area or null
   */
  async findById(...args: Parameters<AreasCRUDService["findById"]>) {
    return this.areasCrudService.findById(...args);
  }

  /**
   * Find areas by world ID
   * @param worldId The world ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas in the specified world
   */
  async findByWorldId(
    ...args: Parameters<AreasCRUDService["findByWorldId"]>
  ): Promise<Area[]> {
    return this.areasCrudService.findByWorldId(...args);
  }

  /**
   * Find areas by parent ID
   * @param parentId The parent area ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas that are children of the specified parent area
   */
  async findByParentId(
    ...args: Parameters<AreasCRUDService["findByParentId"]>
  ): Promise<Area[]> {
    return this.areasCrudService.findByParentId(...args);
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas that have any of the specified tags
   */
  async findByTags(
    ...args: Parameters<AreasCRUDService["findByTags"]>
  ): Promise<Area[]> {
    return this.areasCrudService.findByTags(...args);
  }

  /**
   * Update one or more areas
   * @param entities Single area or array of areas with required _id property
   * @returns The updated area or BulkItemizedResponse for multiple areas
   */
  async update(entities: Parameters<AreasCRUDService["update"]>[0]) {
    return this.areasCrudService.update(entities);
  }

  /**
   * Delete one or more areas by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(
    ids: Parameters<AreasCRUDService["delete"]>[0]
  ): Promise<boolean | null | BulkCountedResponse> {
    return this.areasCrudService.delete(ids);
  }
}
