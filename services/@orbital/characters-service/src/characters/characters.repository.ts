import { Injectable } from "@nestjs/common";
import { Character, CharacterProps } from "@orbital/characters";
import { CharacterModel } from "@orbital/characters-typegoose";
import { DocumentRepository } from "@orbital/typegoose";
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";

@Injectable()
export class CharactersRepository extends DocumentRepository<
  Character,
  CharacterProps,
  typeof CharacterModel
> {
  constructor(
    @InjectModel(CharacterModel)
    characterModel: ReturnModelType<typeof CharacterModel>
  ) {
    super(characterModel, Character);
  }
}
