import { Injectable } from "@nestjs/common";
import { IdentityAccount } from "@orbital/identity-types";
import { CRUDService } from "@orbital/nest";
import {
  IdentitiesRepository,
  IdentityAccountProps,
} from "./identities.repository";

@Injectable()
export class IdentitiesCRUDService extends CRUDService<
  IdentityAccount,
  IdentityAccountProps,
  IdentitiesRepository
> {
  constructor(identitiesRepository: IdentitiesRepository) {
    super(identitiesRepository);
  }

  /**
   * Find identity accounts by character ID
   * @param characterId The character ID to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of identity accounts for the specified character
   */
  async findByCharacterId(
    characterId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<IdentityAccount[]> {
    return this.repository.findByCharacterId(characterId, projection, options);
  }
}
