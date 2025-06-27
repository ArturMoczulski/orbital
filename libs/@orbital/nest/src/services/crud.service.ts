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
  async create(createDto: Partial<T>): Promise<T> {
    return this.repository.create(createDto);
  }

  /**
   * Get an entity by ID
   * @param id The entity ID
   * @returns The entity or null
   */
  async getById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  /**
   * Get all entities matching a filter
   * @param filter Optional filter criteria
   * @returns Array of entities
   */
  async getAll(filter: Record<string, any> = {}): Promise<T[]> {
    return this.repository.findAll(filter);
  }

  /**
   * Update an entity
   * @param entity Partial entity data with required _id property
   * @returns The updated entity or null
   */
  async update(entity: Partial<T> & { _id: string }): Promise<T | null> {
    return this.repository.update(entity);
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The deleted entity or null
   */
  async delete(id: string): Promise<T | null> {
    return this.repository.delete(id);
  }
}
