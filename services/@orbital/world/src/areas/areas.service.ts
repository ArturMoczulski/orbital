import { Injectable } from "@nestjs/common";
import { Area } from "@orbital/core";
import type { AreaModel } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";

@Injectable()
export class AreasService {
  constructor(private readonly areasRepository: AreasRepository) {}

  async createArea(data: Partial<Area>): Promise<AreaModel> {
    return this.areasRepository.create(data);
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
    return this.areasRepository.update(_id, updateData);
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
