import { Controller } from "@nestjs/common";
import { AreasService } from "./areas.service";
import { MicroserviceController, MessagePattern } from "@orbital/microservices";
import type { AreaModel } from "@orbital/typegoose";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

@MicroserviceController("world")
@Controller()
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
  async getArea(id: string): Promise<AreaModel | null> {
    return this.areasService.getArea(id);
  }

  @MessagePattern()
  async updateArea(payload: {
    id: string;
    updateAreaDto: UpdateAreaDto;
  }): Promise<AreaModel | null> {
    return this.areasService.updateArea(payload.id, payload.updateAreaDto);
  }

  @MessagePattern()
  async deleteArea(id: string): Promise<AreaModel | null> {
    return this.areasService.deleteArea(id);
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
