import { Injectable } from "@nestjs/common";
import { BulkCountedResponse } from "@orbital/bulk-operations";
import { Character } from "@orbital/characters";
import { CharactersCRUDService } from "./characters.crud.service";

/**
 * Service for managing Characters
 * This service is a composition that uses CharactersCRUDService internally
 * and proxies its methods
 */
@Injectable()
export class CharacterService {
  /**
   * Constructor for the CharacterService
   * @param charactersCrudService The CharactersCRUDService instance
   */
  constructor(private readonly charactersCrudService: CharactersCRUDService) {}

  /**
   * Create one or more characters
   * @param dto Single character or array of characters to create
   * @returns The created character or BulkItemizedResponse for multiple characters
   */
  async create(dto: Parameters<CharactersCRUDService["create"]>[0]) {
    return this.charactersCrudService.create(dto);
  }

  /**
   * Find characters by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of characters matching the query
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.charactersCrudService.find(filter, projection, options);
  }

  /**
   * Find a character by ID
   * @param id The character ID
   * @param projection Optional fields to project
   * @returns The found character or null
   */
  async findById(id: string, projection?: Record<string, any>) {
    return this.charactersCrudService.findById(id, projection);
  }

  /**
   * Find characters by location ID
   * @param locationId The location ID to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of characters at the specified location
   */
  async findByLocationId(
    locationId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Character[]> {
    return this.charactersCrudService.findByLocationId(
      locationId,
      projection,
      options
    );
  }

  /**
   * Find characters by world ID
   * @param worldId The world ID to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of characters in the specified world
   */
  async findByWorldId(
    worldId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Character[]> {
    return this.charactersCrudService.findByWorldId(
      worldId,
      projection,
      options
    );
  }

  /**
   * Update one or more characters
   * @param entities Single character or array of characters with required _id property
   * @returns The updated character or BulkItemizedResponse for multiple characters
   */
  async update(entities: Parameters<CharactersCRUDService["update"]>[0]) {
    return this.charactersCrudService.update(entities);
  }

  /**
   * Delete one or more characters by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(
    ids: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    return this.charactersCrudService.delete(ids);
  }
}
