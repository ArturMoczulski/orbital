import { Controller, UseFilters } from "@nestjs/common";
import { Character, CharacterProps } from "@orbital/characters";
import { OrbitalMicroservices } from "@orbital/contracts";
import { WithId, WithoutId } from "@orbital/core";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { CharactersCRUDService } from "./characters.crud.service";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class CharactersMicroserviceController extends CRUDController<
  Character,
  CharacterProps,
  CharactersCRUDService
> {
  constructor(charactersService: CharactersCRUDService) {
    super(charactersService);
  }

  /**
   * Create one or more characters
   * @param dto Single character or array of characters to create
   * @returns The created character or BulkItemizedResponse for multiple characters
   */
  @MessagePattern()
  async create(dto: WithoutId<Character> | WithoutId<Character>[]) {
    return super.create(dto);
  }

  /**
   * Find characters by a filter
   * @param payload Query filter criteria, projection, and options
   * @returns Array of characters matching the query
   */
  @MessagePattern()
  async find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) {
    return super.find(payload);
  }

  /**
   * Find a character by ID
   * @param payload Object containing id and optional projection
   * @returns The found character or null
   */
  @MessagePattern()
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  /**
   * Update one or more characters
   * @param data Single character or array of characters with required _id property
   * @returns The updated character or BulkItemizedResponse for multiple characters
   */
  @MessagePattern()
  async update(data: WithId<Character> | WithId<Character>[]) {
    return await super.update(data);
  }

  /**
   * Delete one or more characters by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  @MessagePattern()
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }

  /**
   * Find characters by location ID
   * @param payload Object containing locationId, projection, and options
   * @returns Array of characters at the specified location
   */
  @MessagePattern()
  async findByLocationId(payload: {
    locationId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Character[]> {
    const { locationId, projection, options } = payload;
    return this.service.findByLocationId(locationId, projection, options);
  }

  /**
   * Find characters by world ID
   * @param payload Object containing worldId, projection, and options
   * @returns Array of characters in the specified world
   */
  @MessagePattern()
  async findByWorldId(payload: {
    worldId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Character[]> {
    const { worldId, projection, options } = payload;
    return this.service.findByWorldId(worldId, projection, options);
  }
}
