import { Inject, Injectable } from "@nestjs/common";
import { Character, CharacterProps } from "@orbital/characters";
import {
  CharacterModel,
  DocumentRepository,
  ModelReferences,
  WorldModel,
} from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { getModelToken } from "nestjs-typegoose";

@Injectable()
export class CharactersRepository extends DocumentRepository<
  Character,
  CharacterProps,
  typeof CharacterModel
> {
  constructor(
    @Inject(getModelToken(CharacterModel.name))
    characterModel: ReturnModelType<typeof CharacterModel>,
    @Inject(getModelToken(WorldModel.name))
    worldModel: ReturnModelType<typeof WorldModel>
  ) {
    // Create model references object
    const modelReferences: ModelReferences = {
      world: worldModel,
    };

    // Call super with the required arguments
    super(characterModel, Character, modelReferences);
  }

  /**
   * Find characters by location ID
   * @param locationId The location ID to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of characters at the specified location
   */
  async findByLocationId(
    locationId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Character[]> {
    return this.find({ currentLocation: locationId }, projection, options);
  }
}
