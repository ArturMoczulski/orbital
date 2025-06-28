import { WithId, WithoutId } from "@orbital/typegoose";
import { BulkCountedResponse, BulkItemizedResponse } from "@scout/core";
import { CrudService } from "../services/crud.service";

/**
 * Generic CRUD microservice controller for entities
 * @template T The entity type (e.g., Area, World)
 * @template S The service type (e.g., AreasService, WorldsService)
 */
export abstract class CrudController<T, S extends CrudService<T, any>> {
  /**
   * Constructor for the MicroserviceCrudController
   * @param service The service instance
   * @param entityName Optional name of the entity (e.g., 'Area', 'World')
   */
  constructor(
    protected readonly service: S,
    protected readonly entityName?: string
  ) {}

  /**
   * Create a new entity
   * @param createDto Partial entity data
   * @returns The created entity
   */
  async create(
    createDto: WithoutId<T> | WithoutId<T>[]
  ): Promise<T | BulkItemizedResponse<WithoutId<T>, T>> {
    return this.service.create(createDto);
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
    return this.service.findById(id, projection);
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
    return this.service.find(filter, projection, options);
  }

  /**
   * Find entities by parent ID
   * @param parentId The parent ID
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities
   */
  async findByParentId(
    parentId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T[]> {
    return this.service.findByParentId(parentId, projection, options);
  }

  /**
   * Update one or more entities
   * @param entity Single or array of entities with _id
   * @returns Single updated entity, null, or bulk itemized response
   */
  async update(
    entity: WithId<T> | WithId<T>[]
  ): Promise<T | null | BulkItemizedResponse<WithId<T>, T>> {
    return this.service.update(entity);
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The result of the deletion operation
   */
  async delete(
    id: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    return this.service.delete(id);
  }
}
