import { ReturnModelType } from "@typegoose/typegoose";
import { ZodObject } from "zod";

/**
 * Generic CRUD repository for MongoDB models using Typegoose
 * @template T The entity type (e.g., Area, World)
 */
export abstract class CrudRepository<T> {
  /**
   * Constructor for the CrudRepository
   * @param model The Typegoose model
   * @param schema Optional Zod schema for validation
   */
  constructor(
    protected readonly model: ReturnModelType<any>,
    protected readonly schema?: ZodObject<any>
  ) {}

  /**
   * Create a new entity
   * @param dto Partial entity data without _id
   * @returns The created entity
   */
  async create(dto: Partial<T>): Promise<T> {
    // Validate with Zod schema if provided
    if (this.schema) {
      // Skip _id validation since it's not required for creation
      const { _id, ...rest } = dto as any;
      this.schema.parse(rest);
    }

    // Convert to plain object if it's a class instance with toPlainObject method
    const plainData =
      dto &&
      typeof dto === "object" &&
      "toPlainObject" in dto &&
      typeof dto.toPlainObject === "function"
        ? dto.toPlainObject()
        : dto;

    // Create the entity by calling the model as a function
    // This matches the behavior expected by the tests
    const created = this.model(plainData);
    return (await created.save()) as unknown as T;
  }

  /**
   * Generic find method that accepts any query and projection
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities matching the query
   */
  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T[]> {
    let query = this.model.find(filter, projection);

    if (options) {
      if (options.sort) query = query.sort(options.sort);
      if (options.skip) query = query.skip(options.skip);
      if (options.limit) query = query.limit(options.limit);
      if (options.populate) query = query.populate(options.populate);
    }

    return (await query.exec()) as unknown as T[];
  }

  /**
   * Find an entity by ID
   * @param _id The entity ID
   * @returns The found entity or null
   */
  async findById(_id: string): Promise<T | null> {
    const results = await this.find({ _id });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all entities matching a filter
   * @param filter Optional filter criteria
   * @param projection Optional projection
   * @returns Array of entities
   */
  async findAll(
    filter: Record<string, any> = {},
    projection?: Record<string, any>
  ): Promise<T[]> {
    return this.find(filter, projection);
  }

  /**
   * Update an entity
   * @param entity Partial entity data with required _id property
   * @returns The updated entity or null
   */
  async update(entity: Partial<T> & { _id: string }): Promise<T | null> {
    const { _id, ...updateData } = entity as any;

    // Validate with Zod schema if provided
    if (this.schema && Object.keys(updateData).length > 0) {
      // Get the fields that are being updated
      const updateFields = Object.keys(updateData);

      // Create a partial schema that only validates the fields being updated
      // This makes all fields optional and only includes fields in the update data
      const partialSchema = this.schema.partial().pick(
        updateFields.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {} as Record<string, true>)
      );

      // Validate the update data against the partial schema
      // This will throw an error if validation fails
      partialSchema.parse(updateData);
    }

    // Convert to plain object if it's a class instance with toPlainObject method
    const plainData =
      entity &&
      typeof entity === "object" &&
      "toPlainObject" in entity &&
      typeof entity.toPlainObject === "function"
        ? entity.toPlainObject()
        : entity;

    // Extract _id from the plain data for the query
    const { _id: plainId, ...plainUpdateData } = plainData as any;

    return (await this.model
      .findByIdAndUpdate(plainId, plainUpdateData, { new: true })
      .exec()) as unknown as T;
  }

  /**
   * Delete an entity
   * @param _id The entity ID
   * @returns The deleted entity or null
   */
  async delete(_id: string): Promise<T | null> {
    return (await this.model.findByIdAndDelete(_id).exec()) as unknown as T;
  }
}
