import { Controller, UseFilters } from "@nestjs/common";
import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import { OrbitalMicroservices } from "@orbital/contracts";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CrudController } from "@orbital/nest";
import { AreaModel as Area, WithoutId } from "@orbital/typegoose";
import { AreasService } from "./areas.service";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class AreasMicroserviceController extends CrudController<
  Area,
  AreasService
> {
  constructor(areasService: AreasService) {
    super(areasService);
  }

  /**
   * Create a new area
   * @param createAreaData Partial area data
   * @returns The created area
   */
  @MessagePattern()
  async create(
    createDto: WithoutId<Area> | WithoutId<Area>[]
  ): Promise<Area | BulkItemizedResponse<WithoutId<Area>, Area>> {
    return super.create(createDto);
  }

  /**
   * Get all areas
   * @returns Array of all areas
   */
  @MessagePattern()
  async find(): Promise<Area[]> {
    return super.find();
  }

  /**
   * Get an area by ID
   * @param _id The area ID
   * @returns The area or null
   */
  @MessagePattern()
  async findById(_id: string): Promise<Area | null> {
    return super.findById(_id);
  }

  /**
   * Update an area
   * @param updateAreaData Object containing _id and update data
   * @returns The updated area or null
   */
  @MessagePattern()
  async update(
    updateDto: Area | Area[]
  ): Promise<Area | BulkItemizedResponse<any, any, any>> {
    return super.update(updateDto);
  }

  /**
   * Delete an area
   * @param _id The area ID
   * @returns True if deleted, null if not found
   */
  @MessagePattern()
  async delete(
    ids: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    return super.delete(ids);
  }

  /**
   * Find areas by world ID
   * @param worldId The world ID
   * @returns Array of areas in the specified world
   */
  @MessagePattern()
  async findByWorldId(worldId: string): Promise<Area[]> {
    return this.service.findByWorldId(worldId);
  }

  /**
   * Find areas by parent ID
   * @param parentId The parent area ID or null for top-level areas
   * @returns Array of areas
   */
  @MessagePattern()
  async findByParentId(
    parentId: string,
    projection?: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<Area[]> {
    return super.findByParentId(parentId, projection, options);
  }

  /**
   * Find areas by tags
   * @param tags Array of tags to search for
   * @returns Array of areas with any of the specified tags
   */
  @MessagePattern()
  async findByTags(tags: string[]): Promise<Area[]> {
    return this.service.findByTags(tags);
  }
}
