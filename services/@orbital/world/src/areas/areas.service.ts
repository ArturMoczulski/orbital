import { Injectable } from "@nestjs/common";
import { AreasRepository } from "./areas.repository";
import type { AreaModel } from "@orbital/typegoose";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

@Injectable()
export class AreasService {
  constructor(private readonly areasRepository: AreasRepository) {}

  async createArea(dto: CreateAreaDto): Promise<AreaModel> {
    return this.areasRepository.create(dto);
  }

  async getArea(id: string): Promise<AreaModel | null> {
    return this.areasRepository.findById(id);
  }

  async getAllAreas(
    filter: Record<string, any> = {},
    projection?: any
  ): Promise<AreaModel[]> {
    return this.areasRepository.findAll(filter, projection);
  }

  async updateArea(
    id: string,
    updateDto: UpdateAreaDto
  ): Promise<AreaModel | null> {
    return this.areasRepository.update(id, updateDto);
  }

  async deleteArea(id: string): Promise<AreaModel | null> {
    return this.areasRepository.delete(id);
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
