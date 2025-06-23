import { Injectable, Inject } from "@nestjs/common";
import { getModelToken } from "nestjs-typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { WorldModel } from "@orbital/typegoose";

@Injectable()
export class WorldsRepository {
  constructor(
    @Inject(getModelToken("WorldModel"))
    private readonly worldModel: ReturnModelType<typeof WorldModel>
  ) {}

  async create(dto: Partial<WorldModel>): Promise<WorldModel> {
    const doc = new this.worldModel(dto);
    return doc.save() as unknown as WorldModel;
  }

  async findById(id: string): Promise<WorldModel | null> {
    return this.worldModel.findById(id).exec() as unknown as WorldModel;
  }

  async findAll(): Promise<WorldModel[]> {
    return this.worldModel.find().exec() as unknown as WorldModel[];
  }
}
