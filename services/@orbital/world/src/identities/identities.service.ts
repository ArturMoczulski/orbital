import { Injectable } from "@nestjs/common";
import { BulkCountedResponse } from "@orbital/bulk-operations";
import { IdentityAccount } from "@orbital/identity-types";
import { IdentitiesCRUDService } from "./identities.crud.service";

/**
 * Service for managing IdentityAccounts
 * This service is a composition that uses IdentitiesCRUDService internally
 * and proxies its methods
 */
@Injectable()
export class IdentitiesService {
  constructor(private readonly identitiesCrudService: IdentitiesCRUDService) {}

  /**
   * Create one or more identity accounts
   * @param dto Single account or array of accounts to create
   * @returns The created account or BulkCountedResponse for multiple accounts
   */
  async create(dto: Parameters<IdentitiesCRUDService["create"]>[0]) {
    return this.identitiesCrudService.create(dto);
  }

  /**
   * Find identity accounts by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of identity accounts matching the query
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.identitiesCrudService.find(filter, projection, options);
  }

  /**
   * Find an identity account by ID
   * @param id The account ID
   * @param projection Optional fields to project
   * @returns The found account or null
   */
  async findById(id: string, projection?: Record<string, any>) {
    return this.identitiesCrudService.findById(id, projection);
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
    return this.identitiesCrudService.findByCharacterId(
      characterId,
      projection,
      options
    );
  }

  /**
   * Update one or more identity accounts
   * @param entities Single account or array of accounts with required _id property
   * @returns The updated account or BulkCountedResponse for multiple accounts
   */
  async update(entities: Parameters<IdentitiesCRUDService["update"]>[0]) {
    return this.identitiesCrudService.update(entities);
  }

  /**
   * Delete one or more identity accounts by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(
    ids: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    return this.identitiesCrudService.delete(ids);
  }
}
