import { Inject, Injectable } from "@nestjs/common";
import { IdentityAccount } from "@orbital/identity-types";
import { DocumentRepository } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";

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
    @Inject("IdentityAccountModel")
    identityAccountModel: ReturnModelType<any>
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
    return this.find({ characterId }, projection, options);
  }
}
