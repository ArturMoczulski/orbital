import { Injectable, Inject } from "@nestjs/common";
import { getModelToken } from "nestjs-typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { CharacterModel } from "@orbital/typegoose";

@Injectable()
export class CharactersRepository {
  constructor(
    @Inject(getModelToken("CharacterModel"))
    private readonly characterModel: ReturnModelType<typeof CharacterModel>
  ) {}

  async create(dto: Partial<CharacterModel>): Promise<CharacterModel> {
    const created = new this.characterModel(dto);
    return (await created.save()) as unknown as CharacterModel;
  }

  async findById(id: string): Promise<CharacterModel | null> {
    return (await this.characterModel
      .findById(id)
      .exec()) as unknown as CharacterModel;
  }
}
