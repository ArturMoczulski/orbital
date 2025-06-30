import { Injectable } from "@nestjs/common";
import { BulkCountedResponse } from "@orbital/bulk-operations";
import { WorldModel } from "@orbital/typegoose";
import { WorldsCRUDService } from "./worlds.crud.service";

/**
 * Service for managing Worlds
 * This service is a composition that uses WorldsCRUDService internally
 * and proxies its methods
 */
@Injectable()
export class WorldService {
  /**
   * Constructor for the WorldService
   * @param worldsCrudService The WorldsCRUDService instance
   */
  constructor(private readonly worldsCrudService: WorldsCRUDService) {}

  /**
   * Create one or more worlds
   * @param dto Single world or array of worlds to create
   * @returns The created world or BulkItemizedResponse for multiple worlds
   */
  async create(dto: Parameters<WorldsCRUDService["create"]>[0]) {
    return this.worldsCrudService.create(dto);
  }

  /**
   * Find worlds by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of worlds matching the query
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.worldsCrudService.find(filter, projection, options);
  }

  /**
   * Find a world by ID
   * @param id The world ID
   * @param projection Optional fields to project
   * @returns The found world or null
   */
  async findById(id: string, projection?: Record<string, any>) {
    return this.worldsCrudService.findById(id, projection);
  }

  /**
   * Find worlds by shard
   * @param shard The shard identifier
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of worlds in the specified shard
   */
  async findByShard(
    shard: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<WorldModel[]> {
    return this.worldsCrudService.findByShard(shard, projection, options);
  }

  /**
   * Find worlds by tech level
   * @param techLevel The tech level to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of worlds with the specified tech level
   */
  async findByTechLevel(
    techLevel: number,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<WorldModel[]> {
    return this.worldsCrudService.findByTechLevel(
      techLevel,
      projection,
      options
    );
  }

  /**
   * Update one or more worlds
   * @param entities Single world or array of worlds with required _id property
   * @returns The updated world or BulkItemizedResponse for multiple worlds
   */
  async update(entities: Parameters<WorldsCRUDService["update"]>[0]) {
    return this.worldsCrudService.update(entities);
  }

  /**
   * Delete one or more worlds by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(
    ids: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    return this.worldsCrudService.delete(ids);
  }
}
