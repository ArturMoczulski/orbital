import { Controller, UseFilters } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import { Area, AreaProps, WithId, WithoutId } from "@orbital/core";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { AreasCRUDService } from "./areas.crud.service";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class AreasMicroserviceController extends CRUDController<
  Area,
  AreaProps,
  AreasCRUDService
> {
  constructor(areasService: AreasCRUDService) {
    super(areasService);
  }

  /**
   * Create one or more areas
   * @param dto Single area or array of areas to create
   * @returns The created area or BulkItemizedResponse for multiple areas
   */
  @MessagePattern()
  async create(dto: WithoutId<Area> | WithoutId<Area>[]) {
    return super.create(dto);
  }

  /**
   * Find areas by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of areas matching the query
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
   * Find an area by ID
   * @param id The area ID
   * @param projection Optional fields to project
   * @returns The found area or null
   */
  @MessagePattern()
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  /**
   * Update one or more areas
   * @param payload Object containing _id and updateDto
   * @returns The updated area or BulkItemizedResponse for multiple areas
   */
  @MessagePattern()
  async update(data: WithId<Area> | WithId<Area>[]) {
    return await super.update(data);
  }

  /**
   * Delete one or more areas by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  @MessagePattern()
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }

  /**
   * Find areas by worldId
   * @param worldId The ID of the world to find areas for
   * @param projection Optional projection to apply
   * @param options Optional query options
   * @returns Array of areas belonging to the specified world
   */
  @MessagePattern()
  async findByWorldId(payload: {
    worldId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Area[]> {
    const { worldId, projection, options } = payload;
    return this.service.findByWorldId(worldId, projection, options);
  }

  /**
   * Find areas by parentId
   * @param parentId The ID of the parent area to find child areas for
   * @param projection Optional projection to apply
   * @param options Optional query options
   * @returns Array of areas that are children of the specified parent area
   */
  @MessagePattern()
  async findByParentId(payload: {
    parentId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Area[]> {
    return super.findByParentId(payload);
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @param projection Optional projection to apply
   * @param options Optional query options
   * @returns Array of areas that have any of the specified tags
   */
  @MessagePattern()
  async findByTags(payload: {
    tags: string[];
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<Area[]> {
    return super.findByTags(payload);
  }
}
