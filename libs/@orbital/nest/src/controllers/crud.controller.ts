import { PartialWithoutId } from "@orbital/typegoose";
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
  async create(createDto: PartialWithoutId<T>): Promise<T> {
    return this.service.create(createDto);
  }

  /**
   * Find an entity by ID
   * @param id The entity ID
   * @returns The entity or null
   */
  async findById(id: string): Promise<T | null> {
    return this.service.findById(id);
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
   * Update an entity
   * @param entity Partial entity data with required _id property
   * @returns The updated entity or null
   */
  async update(entity: Partial<T> & { _id: string }): Promise<T | null> {
    return this.service.update(entity);
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The result of the deletion operation
   */
  async delete(id: string): Promise<boolean | null> {
    return this.service.delete(id);
  }
}
