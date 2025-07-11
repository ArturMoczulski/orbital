import { Injectable } from "@nestjs/common";
import { IdentityAccountModel } from "@orbital/identity-typegoose";
import { IdentityAccount } from "@orbital/identity-types";
import { DocumentRepository } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";

// Define IdentityAccountProps locally based on IdentityAccount properties
export type IdentityAccountProps = {
  _id: string;
  characterId: string;
  provider: string;
  identifier: string;
  credentials: any[];
  createdAt?: Date;
  updatedAt?: Date;
};

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
