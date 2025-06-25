import { Injectable, Inject } from "@nestjs/common";
import { getModelToken } from "nestjs-typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { AreaModel } from "@orbital/typegoose";

@Injectable()
export class AreasRepository {
  constructor(
    @Inject(getModelToken("AreaModel"))
    private readonly areaModel: ReturnModelType<typeof AreaModel>
  ) {}

  async create(dto: Partial<AreaModel>): Promise<AreaModel> {
    const created = new this.areaModel(dto);
    return (await created.save()) as unknown as AreaModel;
  }

  async findById(_id: string): Promise<AreaModel | null> {
    return (await this.areaModel.findById(_id).exec()) as unknown as AreaModel;
  }

  async findAll(
    filter: Record<string, any> = {},
    projection?: any
  ): Promise<AreaModel[]> {
    return (await this.areaModel
      .find(filter, projection)
      .exec()) as unknown as AreaModel[];
  }

  async update(
    _id: string,
    updateDto: Partial<AreaModel>
  ): Promise<AreaModel | null> {
    return (await this.areaModel
      .findByIdAndUpdate(_id, updateDto, { new: true })
      .exec()) as unknown as AreaModel;
  }

  async findByParentId(parentId: string | null): Promise<AreaModel[]> {
    return (await this.areaModel
      .find({ parentId })
      .exec()) as unknown as AreaModel[];
  }

  async findByTags(tags: string[]): Promise<AreaModel[]> {
    return (await this.areaModel
      .find({ tags: { $in: tags } })
      .exec()) as unknown as AreaModel[];
  }

  async delete(_id: string): Promise<AreaModel | null> {
    return (await this.areaModel
      .findByIdAndDelete(_id)
      .exec()) as unknown as AreaModel;
  }

  async findByWorldId(worldId: string): Promise<AreaModel[]> {
    return (await this.areaModel
      .find({ worldId })
      .exec()) as unknown as AreaModel[];
  }
}
