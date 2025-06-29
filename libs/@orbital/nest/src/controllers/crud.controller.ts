import { IdentifiableObject, IdentifiableObjectProps } from "@orbital/core";
import { CrudService } from "../services/crud.service";

/**
 * Generic CRUD microservice controller for entities
 * @template TObjectType The entity type (e.g., Area, World)
 * @template TCrudService The service type (e.g., AreasService, WorldsService)
 */
export abstract class CrudController<
  TObjectType extends IdentifiableObject,
  TObjectTypeProps extends IdentifiableObjectProps,
  TCrudService extends CrudService<TObjectType, TObjectTypeProps>,
> {
  /**
   * Constructor for the MicroserviceCrudController
   * @param service The service instance
   */
  constructor(protected readonly service: TCrudService) {}

  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns The created entity or BulkItemizedResponse for multiple entities
   */
  async create(dto: Parameters<TCrudService["create"]>[0]) {
    return this.service.create(dto);
  }

  /**
   * Find domain objects by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities matching the query
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.service.find(filter, projection, options);
  }

  /**
   * Find a domain object by ID
   * @param id The entity ID
   * @param projection Optional fields to project
   * @returns The found entity or null
   */
  async findById(id: string, projection?: Record<string, any>) {
    // If projection is undefined, don't pass it to match test expectations
    return projection
      ? this.service.findById(id, projection)
      : this.service.findById(id);
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
    return this.service.findByParentId(parentId, projection, options);
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
    return this.service.findByTags(tags, projection, options);
  }

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns The updated entity or BulkItemizedResponse for multiple entities
   */
  async update(entities: Parameters<TCrudService["update"]>[0]) {
    return this.service.update(entities);
  }

  /**
   * Delete one or more entities by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(ids: string | string[]) {
    return this.service.delete(ids);
  }
}
