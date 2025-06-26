import { Controller, UseFilters } from "@nestjs/common";
import { Area } from "@orbital/core";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import type { AreaModel } from "@orbital/typegoose";
import { AreasService } from "./areas.service";

@MicroserviceController("world")
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("world"))
export class AreasMicroserviceController {
  constructor(private readonly areasService: AreasService) {}

  @MessagePattern()
  async createArea(createAreaData: Partial<Area>): Promise<AreaModel> {
    return this.areasService.createArea(createAreaData);
  }

  @MessagePattern()
  async getAllAreas(): Promise<AreaModel[]> {
    return this.areasService.getAllAreas();
  }

  @MessagePattern()
  async getArea(_id: string): Promise<AreaModel | null> {
    return this.areasService.getArea(_id);
  }

  @MessagePattern()
  async updateArea(updateAreaData: Partial<Area>): Promise<AreaModel | null> {
    const { _id, ...updateData } = updateAreaData;
    return this.areasService.updateArea(_id as string, updateData);
  }

  @MessagePattern()
  async deleteArea(_id: string): Promise<AreaModel | null> {
    return this.areasService.deleteArea(_id);
  }

  @MessagePattern()
  async getAreasByWorldId(worldId: string): Promise<AreaModel[]> {
    return this.areasService.getAreasByWorldId(worldId);
  }

  @MessagePattern()
  async getAreasByParentId(parentId: string | null): Promise<AreaModel[]> {
    return this.areasService.getAreasByParentId(parentId);
  }

  @MessagePattern()
  async getAreasByTags(tags: string[]): Promise<AreaModel[]> {
    return this.areasService.getAreasByTags(tags);
  }
}
