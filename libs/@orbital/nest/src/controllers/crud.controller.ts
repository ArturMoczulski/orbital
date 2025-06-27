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
   * @param entityName The name of the entity (e.g., 'Area', 'World')
   */
  constructor(
    protected readonly service: S,
    protected readonly entityName: string
  ) {}

  /**
   * Create a new entity
   * @param createDto Partial entity data
   * @returns The created entity
   */
  async create(createDto: Partial<T>): Promise<T> {
    return this.service.create(createDto);
  }

  /**
   * Get an entity by ID
   * @param id The entity ID
   * @returns The entity or null
   */
  async getById(id: string): Promise<T | null> {
    return this.service.getById(id);
  }

  /**
   * Get all entities matching a filter
   * @param filter Optional filter criteria
   * @returns Array of entities
   */
  async getAll(filter: Record<string, any> = {}): Promise<T[]> {
    return this.service.getAll(filter);
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
   * @returns The deleted entity or null
   */
  async delete(id: string): Promise<T | null> {
    return this.service.delete(id);
  }
}
