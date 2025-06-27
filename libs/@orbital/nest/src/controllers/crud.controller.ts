import { Injectable } from "@nestjs/common";
import { CrudService } from "../services/crud.service";

/**
 * Generic CRUD microservice controller for entities
 * @template T The entity type (e.g., Area, World)
 * @template S The service type (e.g., AreasService, WorldsService)
 */
@Injectable()
export abstract class MicroserviceCrudController<
  T,
  S extends CrudService<T, any>
> {
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
   * @param updateData Object containing _id and updateDto
   * @returns The updated entity or null
   */
  /**
   * Update an entity
   * @param updateData Object containing _id and updateDto
   * @returns The updated entity or null
   */
  async update(updateData: {
    _id: string;
    updateDto: Partial<T>;
  }): Promise<T | null> {
    const { _id, updateDto } = updateData;
    return this.service.update(_id, updateDto);
  }

  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The deleted entity or null
   */
  /**
   * Delete an entity
   * @param id The entity ID
   * @returns The deleted entity or null
   */
  async delete(id: string): Promise<T | null> {
    return this.service.delete(id);
  }
}

/**
 * Export the MicroserviceCrudController as the default CrudController
 * We can add other controller types (e.g., RestCrudController) in the future
 */
export { MicroserviceCrudController as CrudController };
