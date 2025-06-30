import { Controller, UseFilters } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import { AreaProps } from "@orbital/core";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CrudController } from "@orbital/nest";
import { AreaModel as TypegooseArea } from "@orbital/typegoose";
import { AreasService } from "./areas.service";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class AreasMicroserviceController extends CrudController<
  TypegooseArea,
  AreaProps,
  AreasService
> {
  constructor(areasService: AreasService) {
    super(areasService);
  }

  /**
   * Create one or more areas
   * @param dto Single area or array of areas to create
   * @returns The created area or BulkItemizedResponse for multiple areas
   */
  @MessagePattern()
  async create(dto: Parameters<AreasService["create"]>[0]) {
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
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return super.find(filter, projection, options);
  }

  /**
   * Find an area by ID
   * @param id The area ID
   * @param projection Optional fields to project
   * @returns The found area or null
   */
  @MessagePattern()
  async findById(id: string, projection?: Record<string, any>) {
    return super.findById(id, projection);
  }

  /**
   * Update one or more areas
   * @param payload Object containing _id and updateDto
   * @returns The updated area or BulkItemizedResponse for multiple areas
   */
  @MessagePattern()
  async update(payload: { _id: string; updateDto: Partial<AreaProps> }) {
    const { _id, updateDto } = payload;

    // First, find the existing entity
    const existingEntity = await this.service.findById(_id);
    if (!existingEntity) {
      return null;
    }

    // Extract the plain object from the entity to avoid document properties
    const existingData = existingEntity.toPlainObject
      ? existingEntity.toPlainObject()
      : { ...existingEntity };

    // Ensure worldId is preserved
    if (!updateDto.worldId && existingData.worldId) {
      updateDto.worldId = existingData.worldId;
    }

    // Update and return the entity
    const result = await super.update({ _id, ...updateDto });

    // If result doesn't have worldId but existingEntity does, add it
    if (result && !result.worldId && existingData.worldId) {
      result.worldId = existingData.worldId;
    }

    return result;
  }

  /**
   * Delete one or more areas by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  @MessagePattern()
  async delete(ids: string | string[]) {
    // For single ID, fetch the entity before deleting
    if (!Array.isArray(ids)) {
      const entityToDelete = await this.service.findById(ids);
      if (!entityToDelete) {
        return null;
      }

      // Store the entity data before deletion
      const entityData = entityToDelete.toPlainObject
        ? entityToDelete.toPlainObject()
        : { ...entityToDelete };

      const deleteResult = await super.delete(ids);
      if (deleteResult === true) {
        // Return the entity data with _id explicitly set
        // Use type assertion to bypass TypeScript's type checking
        return {
          _id: ids,
          ...entityData,
        } as any; // Type assertion to match the expected return type
      }
      return null;
    }

    // For multiple IDs, use the standard behavior
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
  async findByWorldId(
    worldId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<TypegooseArea[]> {
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
  async findByParentId(
    parentId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<TypegooseArea[]> {
    return this.service.findByParentId(parentId, projection, options);
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @param projection Optional projection to apply
   * @param options Optional query options
   * @returns Array of areas that have any of the specified tags
   */
  @MessagePattern()
  async findByTags(
    tags: string[],
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<TypegooseArea[]> {
    return this.service.findByTags(tags, projection, options);
  }
}
