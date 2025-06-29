import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import { WithId } from "@orbital/typegoose";
import { CrudRepository } from "../repositories/crud.repository";

/**
 * Generic CRUD service for entities
 * @template T The entity type (e.g., Area, World)
 * @template R The repository type (e.g., AreasRepository, WorldsRepository)
 */
export abstract class CrudService<T, R extends CrudRepository<T>> {
  /**
   * Constructor for the CrudService
   * @param repository The repository instance
   */
  constructor(protected readonly repository: R) {}

  /**
   * Create a new entity
   * @param data Partial entity data
   * @returns The created entity
   */
  /**
   * Create one or more entities
   * @param data Single or array of entity data
   * @returns Single entity or bulk itemized response
   */
  /**
   * Create one or more entities
   * @param dto Single or array of create input
   * @returns Created entity or bulk itemized response
   */
  async create(
    dto: Parameters<R["create"]>[0]
  ): Promise<ReturnType<R["create"]>> {
    return this.repository.create(dto) as ReturnType<R["create"]>;
  }

  /**
   * Find an entity by ID
   * @param id The entity ID
   * @param projection Optional fields to project
   * @returns The entity or null
   */
  async findById(
    id: string,
    projection?: Record<string, any>
  ): Promise<T | null> {
    return this.repository.findById(id, projection);
  }

  /**
   * Find entities matching a filter
   * @param filter Optional filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T[]> {
    return this.repository.find(filter, projection, options);
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
  ): Promise<T[]> {
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
  ): Promise<T[]> {
    return this.repository.findByTags(tags, projection, options);
  }

  /**
   * Update an entity
   * @param entity Partial entity data with required _id property
   * @returns The updated entity or null
   */
  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id
   * @returns Single entity, null, or bulk itemized response
   */
  async update(
    entities: WithId<T> | WithId<T>[]
  ): Promise<T | null | BulkItemizedResponse<WithId<T>, T>> {
    return this.repository.update(entities);
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The result of the deletion operation
   */
  /**
   * Delete one or more entities by ID
   * @param ids Single ID or array of IDs
   * @returns Boolean, null, or bulk counted response
   */
  async delete(
    ids: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    return this.repository.delete(ids);
  }
}
