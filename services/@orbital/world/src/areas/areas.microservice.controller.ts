import { Controller, UseFilters } from "@nestjs/common";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CrudController } from "@orbital/nest";
import { AreaModel as Area } from "@orbital/typegoose";
import { AreasService } from "./areas.service";

@MicroserviceController("world")
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("world"))
export class AreasMicroserviceController extends CrudController<
  Area,
  AreasService
> {
  constructor(areasService: AreasService) {
    super(areasService, "Area");
  }

  /**
   * Create a new area
   * @param createAreaData Partial area data
   * @returns The created area
   */
  @MessagePattern()
  async createArea(createAreaData: Partial<Area>): Promise<Area> {
    return this.create(createAreaData);
  }

  /**
   * Get all areas
   * @returns Array of all areas
   */
  @MessagePattern()
  async getAllAreas(): Promise<Area[]> {
    return this.getAll();
  }

  /**
   * Get an area by ID
   * @param _id The area ID
   * @returns The area or null
   */
  @MessagePattern()
  async getArea(_id: string): Promise<Area | null> {
    return this.getById(_id);
  }

  /**
   * Update an area
   * @param updateAreaData Object containing _id and update data
   * @returns The updated area or null
   */
  @MessagePattern()
  async updateArea(updateAreaData: Partial<Area>): Promise<Area | null> {
    const { _id, ...updateData } = updateAreaData;
    return this.update({ _id: _id as string, updateDto: updateData });
  }

  /**
   * Delete an area
   * @param _id The area ID
   * @returns The deleted area or null
   */
  @MessagePattern()
  async deleteArea(_id: string): Promise<Area | null> {
    return this.delete(_id);
  }

  /**
   * Get areas by world ID
   * @param worldId The world ID
   * @returns Array of areas in the specified world
   */
  @MessagePattern()
  async getAreasByWorldId(worldId: string): Promise<Area[]> {
    return this.service.getAreasByWorldId(worldId);
  }

  /**
   * Get areas by parent ID
   * @param parentId The parent area ID or null for top-level areas
   * @returns Array of areas
   */
  @MessagePattern()
  async getAreasByParentId(parentId: string | null): Promise<Area[]> {
    return this.service.getAreasByParentId(parentId);
  }

  /**
   * Get areas by tags
   * @param tags Array of tags to search for
   * @returns Array of areas with any of the specified tags
   */
  @MessagePattern()
  async getAreasByTags(tags: string[]): Promise<Area[]> {
    return this.service.getAreasByTags(tags);
  }
}
