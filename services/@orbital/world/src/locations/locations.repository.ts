import { Injectable, Inject } from "@nestjs/common";
import { getModelToken } from "nestjs-typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { LocationModel } from "@orbital/typegoose";

@Injectable()
export class LocationsRepository {
  constructor(
    @Inject(getModelToken("LocationModel"))
    private readonly locationModel: ReturnModelType<typeof LocationModel>
  ) {}

  async create(dto: Partial<LocationModel>): Promise<LocationModel> {
    const doc = new this.locationModel(dto);
    return doc.save() as unknown as LocationModel;
  }

  async findById(id: string): Promise<LocationModel | null> {
    return this.locationModel.findById(id).exec() as unknown as LocationModel;
  }
}
