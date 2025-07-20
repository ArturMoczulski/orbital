import { Injectable } from "@nestjs/common";
import { Character, CharacterProps } from "@orbital/characters";
import { CRUDService } from "@orbital/nest";
import { CharactersRepository } from "./characters.repository";

@Injectable()
export class CharactersCRUDService extends CRUDService<
  Character,
  CharacterProps,
  CharactersRepository
> {
  constructor(charactersRepository: CharactersRepository) {
    super(charactersRepository);
  }

  /**
   * Find characters by IDs
   * @param ids Array of character IDs
   * @returns Array of characters
   */
  async findByIds(ids: string[]): Promise<Character[]> {
    return this.repository.find({ _id: { $in: ids } });
  }
}
