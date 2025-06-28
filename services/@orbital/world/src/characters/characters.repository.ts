import { Inject, Injectable } from "@nestjs/common";
import { CharacterModel, WithoutId } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class CharactersRepository {
  constructor(
    @Inject(getModelToken("CharacterModel"))
    private readonly characterModel: ReturnModelType<typeof CharacterModel>
  ) {}

  async create(dto: WithoutId<CharacterModel>): Promise<CharacterModel> {
    const created = new this.characterModel(dto);
    return (await created.save()) as unknown as CharacterModel;
  }

  async findById(id: string): Promise<CharacterModel | null> {
    return (await this.characterModel
      .findById(id)
      .exec()) as unknown as CharacterModel;
  }
}
