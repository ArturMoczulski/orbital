import { Controller, UseFilters } from "@nestjs/common";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import type { AreaModel } from "@orbital/typegoose";
import { AreasService } from "./areas.service";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

@MicroserviceController("world")
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("world"))
export class AreasMicroserviceController {
  constructor(private readonly areasService: AreasService) {}

  @MessagePattern()
  async createArea(createAreaDto: CreateAreaDto): Promise<AreaModel> {
    return this.areasService.createArea(createAreaDto);
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
  async updateArea(payload: {
    _id: string;
    updateDto: UpdateAreaDto;
  }): Promise<AreaModel | null> {
    return this.areasService.updateArea(payload._id, payload.updateDto);
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
