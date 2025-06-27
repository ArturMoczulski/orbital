import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@scout/core/src/bulk-operations";
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
    const result = await this.repository.create(createDto);
    // If the result is a BulkItemizedResponse, extract the single entity
    if (result instanceof BulkItemizedResponse) {
      return result.asSingle() as T;
    }
    return result as T;
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
    const result = await this.repository.update(entity);
    // If the result is a BulkItemizedResponse, extract the single entity or return null
    if (result instanceof BulkItemizedResponse) {
      try {
        return result.asSingle() as T;
      } catch (error) {
        return null;
      }
    }
    return result;
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The deleted entity or null
   */
  async delete(id: string): Promise<T | null> {
    const result = await this.repository.delete(id);
    // If the result is a BulkCountedResponse, return null (entity was already returned before deletion)
    if (result instanceof BulkCountedResponse) {
      return null;
    }
    return result;
  }
}
