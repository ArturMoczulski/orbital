import { Injectable } from "@nestjs/common";
import type { CharacterModel, WithoutId } from "@orbital/typegoose";
import { CharactersRepository } from "./characters.repository";

@Injectable()
export class CharactersService {
  constructor(private readonly charactersRepository: CharactersRepository) {}

  async createCharacter(
    dto: WithoutId<CharacterModel>
  ): Promise<CharacterModel> {
    return this.charactersRepository.create(dto);
  }

  async getCharacter(id: string): Promise<CharacterModel | null> {
    return this.charactersRepository.findById(id);
  }
}
