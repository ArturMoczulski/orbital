import { Controller, UseFilters } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { AreaModel as TypegooseArea } from "@orbital/typegoose";
import { AreasCRUDService } from "./areas.crud.service";
import { AreaProps } from "./areas.repository";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class AreasMicroserviceController extends CRUDController<
  TypegooseArea,
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
  async create(dto: Parameters<AreasCRUDService["create"]>[0]) {
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
  async update(data: Parameters<AreasCRUDService["update"]>[0]) {
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
