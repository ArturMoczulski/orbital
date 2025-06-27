import { PartialWithoutId } from "@orbital/typegoose";
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
   * @param createDto Partial entity data
   * @returns The created entity
   */
  async create(createDto: PartialWithoutId<T>): Promise<T> {
    return this.repository.create(createDto) as Promise<T>;
  }

  /**
   * Find an entity by ID
   * @param id The entity ID
   * @returns The entity or null
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
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
   * Update an entity
   * @param entity Partial entity data with required _id property
   * @returns The updated entity or null
   */
  async update(entity: Partial<T> & { _id: string }): Promise<T | null> {
    return this.repository.update(entity) as Promise<T | null>;
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The result of the deletion operation
   */
  async delete(id: string): Promise<boolean | null> {
    return this.repository.delete(id) as Promise<boolean | null>;
  }
}
