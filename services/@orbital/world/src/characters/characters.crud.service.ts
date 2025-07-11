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
    return this.repository.findByLocationId(locationId, projection, options);
  }

  /**
   * Find characters by world ID
   * @param worldId The world ID to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of characters in the specified world
   */
  async findByWorldId(
    worldId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Character[]> {
    return this.repository.find({ worldId }, projection, options);
  }
}
