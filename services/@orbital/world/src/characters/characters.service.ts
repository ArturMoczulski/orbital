import { Injectable } from "@nestjs/common";
import { CharactersRepository } from "./characters.repository";
import type { CharacterModel } from "@orbital/typegoose";

@Injectable()
export class CharactersService {
  constructor(private readonly charactersRepository: CharactersRepository) {}

  async createCharacter(dto: Partial<CharacterModel>): Promise<CharacterModel> {
    return this.charactersRepository.create(dto);
  }

  async getCharacter(id: string): Promise<CharacterModel | null> {
    return this.charactersRepository.findById(id);
  }
}
