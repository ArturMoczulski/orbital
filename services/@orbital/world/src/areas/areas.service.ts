import { Injectable } from "@nestjs/common";
import { Area, AreaMap, Position } from "@orbital/core";
import type { AreaModel } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";

@Injectable()
export class AreasService {
  constructor(private readonly areasRepository: AreasRepository) {}

  /**
   * Convert data to model instance
   * This ensures that Position and AreaMap are proper class instances
   */
  private dataToModel(data: any): any {
    const model: any = { ...data };

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

  async createArea(data: Partial<Area>): Promise<AreaModel> {
    const modelData = this.dataToModel(data);
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
    updateData: Partial<Area>
  ): Promise<AreaModel | null> {
    const modelData = this.dataToModel(updateData);
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
