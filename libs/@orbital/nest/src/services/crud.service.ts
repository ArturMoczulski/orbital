import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  WithoutId,
} from "@orbital/core";
import { DocumentRepository, WithId } from "@orbital/typegoose";

/**
 * Interface defining the contract for CRUD operations
 * @template T The entity type (e.g., Area, World)
 * @template TEntityProps The props type that the entity constructor accepts
 * @template TCreateInput The input type for create operations
 * @template TUpdateInput The input type for update operations
 */
export interface ICRUDService<
  T extends IdentifiableObject,
  TEntityProps extends IdentifiableObjectProps,
  TCreateInput = WithoutId<TEntityProps>,
  TUpdateInput = WithId<TEntityProps>,
> {
  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns The created entity or BulkItemizedResponse for multiple entities
   */
  create(
    dto: TCreateInput | TCreateInput[]
  ): Promise<T | BulkItemizedResponse<TCreateInput, T, never>>;

  /**
   * Find domain objects by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities matching the query
   */
  find(
    filter?: Record<string, any>,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T[]>;

  /**
   * Find a domain object by ID
   * @param id The entity ID
   * @param projection Optional fields to project
   * @returns The found entity or null
   */
  findById(id: string, projection?: Record<string, any>): Promise<T | null>;

  /**
   * Find entities by parent ID
   * @param parentId The parent ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities with the specified parent ID
   */
  findByParentId(
    parentId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T[]>;

  /**
   * Find entities by tags
   * @param tags Array of tags to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities with any of the specified tags
   */
  findByTags(
    tags: string[],
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T[]>;

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns The updated entity or BulkItemizedResponse for multiple entities
   */
  update(
    entities: TUpdateInput | TUpdateInput[]
  ): Promise<T | null | BulkItemizedResponse<TUpdateInput, T, never>>;

  /**
   * Delete one or more entities by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  delete(ids: string | string[]): Promise<boolean | null | BulkCountedResponse>;
}

/**
 * Generic CRUD service for entities
 * @template T The entity type (e.g., Area, World)
 * @template TEntityProps The props type that the entity constructor accepts
 * @template R The repository type (e.g., AreasRepository, WorldsRepository)
 */
export class CRUDService<
  T extends IdentifiableObject,
  TEntityProps extends IdentifiableObjectProps,
  R extends DocumentRepository<T, TEntityProps> = DocumentRepository<
    T,
    TEntityProps
  >,
> implements
    ICRUDService<
      T,
      TEntityProps,
      Parameters<R["create"]>[0],
      Parameters<R["update"]>[0]
    >
{
  /**
   * Constructor for the CRUDService
   * @param repository The repository instance
   */
  constructor(protected readonly repository: R) {}

  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async create(dto: Parameters<R["create"]>[0]) {
    return this.repository.create(dto);
  }

  /**
   * Find domain objects by a filter with documents attached
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities matching the query with documents attached
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.repository.find(filter, projection, options);
  }

  /**
   * Find a domain object by ID with document attached
   * @param id The entity ID
   * @param projection Optional fields to project
   * @returns The found entity with document attached or null
   */
  async findById(id: string, projection?: Record<string, any>) {
    return this.repository.findById(id, projection);
  }

  /**
   * Find entities by parent ID
   * @param parentId The parent ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities with the specified parent ID
   */
  async findByParentId(
    parentId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.repository.findByParentId(parentId, projection, options);
  }

  /**
   * Find entities by tags
   * @param tags Array of tags to search for
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities with any of the specified tags
   */
  async findByTags(
    tags: string[],
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.repository.findByTags(tags, projection, options);
  }

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async update(entities: Parameters<R["update"]>[0]) {
    return this.repository.update(entities);
  }

  /**
   * Delete one or more entities by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(ids: string | string[]) {
    return this.repository.delete(ids);
  }
}
