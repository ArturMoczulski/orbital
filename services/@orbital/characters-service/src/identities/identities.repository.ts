import { Injectable } from "@nestjs/common";
import { IdentityAccount, IdentityAccountProps } from "@orbital/identity-types";
import { DocumentRepository } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";
import { IdentityAccountModel } from "./models/identity-account.model";

// Re-export IdentityAccountProps for backward compatibility
export { IdentityAccountProps } from "@orbital/identity-types";

@Injectable()
export class IdentitiesRepository extends DocumentRepository<
  IdentityAccount,
  IdentityAccountProps,
  any
> {
  constructor(
    @InjectModel(IdentityAccountModel)
    identityAccountModel: ReturnModelType<typeof IdentityAccountModel>
  ) {
    super(identityAccountModel, IdentityAccount);
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
    // If projection is provided, ensure characterId is included
    const finalProjection = projection
      ? { ...projection, characterId: 1 }
      : projection;

    return this.find({ characterId }, finalProjection, options);
  }
}
