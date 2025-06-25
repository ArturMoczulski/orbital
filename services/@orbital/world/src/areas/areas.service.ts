import { Injectable } from "@nestjs/common";
import { AreasRepository } from "./areas.repository";
import type { AreaModel } from "@orbital/typegoose";
import { CreateAreaDto, UpdateAreaDto } from "./dto";
import { Position, AreaMap } from "@orbital/core";

@Injectable()
export class AreasService {
  constructor(private readonly areasRepository: AreasRepository) {}

  /**
   * Convert DTO to model instance
   * This ensures that Position and AreaMap are proper class instances
   */
  private dtoToModel(dto: any): any {
    const model: any = { ...dto };

    // Transform position to a Position instance if it exists
    if (model.position) {
      model.position = new Position(model.position);
    }

    // Transform areaMap to an AreaMap instance if it exists
    if (model.areaMap) {
      model.areaMap = new AreaMap(model.areaMap);
    }

    return model;
  }

  async createArea(dto: CreateAreaDto): Promise<AreaModel> {
    const modelData = this.dtoToModel(dto);
    return this.areasRepository.create(modelData);
  }

  async getArea(_id: string): Promise<AreaModel | null> {
    return this.areasRepository.findById(_id);
  }

  async getAllAreas(
    filter: Record<string, any> = {},
    projection?: any
  ): Promise<AreaModel[]> {
    return this.areasRepository.findAll(filter, projection);
  }

  async updateArea(
    _id: string,
    updateDto: UpdateAreaDto
  ): Promise<AreaModel | null> {
    const modelData = this.dtoToModel(updateDto);
    return this.areasRepository.update(_id, modelData);
  }

  async deleteArea(_id: string): Promise<AreaModel | null> {
    return this.areasRepository.delete(_id);
  }

  async getAreasByWorldId(worldId: string): Promise<AreaModel[]> {
    return this.areasRepository.findByWorldId(worldId);
  }

  async getAreasByParentId(parentId: string | null): Promise<AreaModel[]> {
    return this.areasRepository.findByParentId(parentId);
  }

  async getAreasByTags(tags: string[]): Promise<AreaModel[]> {
    return this.areasRepository.findByTags(tags);
  }
}
