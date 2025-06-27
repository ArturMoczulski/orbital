import { PartialWithoutId } from "@orbital/typegoose";
import {
  BulkCountedResponse,
  BulkItemizedResponse,
  BulkOperation,
} from "@scout/core/src/bulk-operations";
import { ReturnModelType } from "@typegoose/typegoose";
import { ZodError, ZodObject } from "zod";

/**
 * Generic CRUD repository for MongoDB models using Typegoose
 * @template T The entity type (e.g., Area, World)
 * @template TCreateInput The type for create operations, defaults to PartialWithoutId<T>
 */
export abstract class CrudRepository<T, TCreateInput = PartialWithoutId<T>> {
  /**
   * Constructor for the CrudRepository
   * @param model The Typegoose model
   * @param schema Optional Zod schema for validation
   */
  constructor(
    protected readonly model: ReturnModelType<any>,
    protected readonly schema: ZodObject<any>
  ) {}

  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns BulkItemizedResponse for multiple entities or a single entity if input was singular
   */
  async create(
    dto: TCreateInput | TCreateInput[]
  ): Promise<T | BulkItemizedResponse<TCreateInput, T>> {
    const isSingular = !Array.isArray(dto);
    const items = isSingular ? [dto] : dto;

    // Use BulkOperation.itemized for bulk creation
    const response = await BulkOperation.itemized<TCreateInput, T>(
      items,
      async (dtos, success, fail) => {
        try {
          // Validate and prepare all items
          const validItems = dtos.map((item) => {
            // Validate with Zod schema
            // Skip _id validation since it's not required for creation
            const { _id, ...rest } = item as any;
            this.schema.parse(rest);

            // Convert to plain object if it's a class instance with toPlainObject method
            return item &&
              typeof item === "object" &&
              "toPlainObject" in item &&
              typeof item.toPlainObject === "function"
              ? item.toPlainObject()
              : item;
          });

          // Use insertMany for bulk insertion instead of individual saves
          const createdItems = await this.model.insertMany(validItems);

          // Mark each item as success
          createdItems.forEach((created: any, index: number) => {
            success(dtos[index], created as unknown as T);
          });
        } catch (error) {
          // If there's a global error, mark all items as failed
          dtos.forEach((item) => {
            fail(item, { message: error.message });
          });
        }
      }
    );

    // If input was singular, return the single result
    return isSingular ? (response.asSingle() as T) : response;
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
   * Find a single entity matching the filter criteria
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options (except limit, which is set to 1)
   * @returns The found entity or null if not found
   */
  async findOne(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T | null> {
    // Create a new options object with limit set to 1
    const findOneOptions = { ...(options || {}), limit: 1 };

    const results = await this.find(filter, projection, findOneOptions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find an entity by ID
   * @param _id The entity ID
   * @returns The found entity or null
   */
  /**
   * Find an entity by ID
   * @param _id The entity ID
   * @param projection Optional fields to project
   * @returns The found entity or null
   */
  async findById(
    _id: string,
    projection?: Record<string, any>
  ): Promise<T | null> {
    return this.findOne({ _id }, projection);
  }

  /**
   * Find entities by parent ID
   * @param parentId The parent ID or null for top-level entities
   * @returns Array of entities with the specified parent ID
   * @throws Error if the entity schema doesn't have a parentId field
   */
  async findByParentId(parentId: string | null): Promise<T[]> {
    // Check if the schema has a parentId field
    if (!this.schema.shape.parentId) {
      throw new ZodError([
        {
          code: "invalid_type",
          expected: "object",
          received: "undefined",
          path: ["parentId"],
          message: "Entity schema does not have a parentId field",
        },
      ]);
    }

    return this.find({ parentId });
  }

  /**
   * Find entities by tags
   * @param tags Array of tags to search for
   * @returns Array of entities with any of the specified tags
   * @throws Error if the entity schema doesn't have a tags field
   */
  async findByTags(tags: string[]): Promise<T[]> {
    // Check if the schema has a tags field
    if (!this.schema.shape.tags) {
      throw new ZodError([
        {
          code: "invalid_type",
          expected: "object",
          received: "undefined",
          path: ["tags"],
          message: "Entity schema does not have a tags field",
        },
      ]);
    }

    return this.find({ tags: { $in: tags } });
  }

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns BulkItemizedResponse for multiple entities or a single entity if input was singular
   */
  async update(
    entities: (Partial<T> & { _id: string }) | (Partial<T> & { _id: string })[]
  ): Promise<T | null | BulkItemizedResponse<Partial<T> & { _id: string }, T>> {
    const isSingular = !Array.isArray(entities);
    const items = isSingular ? [entities] : entities;

    // Use BulkOperation.itemized for bulk updates
    const response = await BulkOperation.itemized<
      Partial<T> & { _id: string },
      T
    >(items, async (updateItems, success, fail) => {
      try {
        // Prepare bulk write operations
        const bulkOps = updateItems.map((entity) => {
          const { _id, ...updateData } = entity as any;

          // Validate with Zod schema
          if (Object.keys(updateData).length > 0) {
            try {
              // Get the fields that are being updated
              const updateFields = Object.keys(updateData);

              // Create a partial schema that only validates the fields being updated
              const partialSchema = this.schema.partial().pick(
                updateFields.reduce((acc, field) => {
                  acc[field] = true;
                  return acc;
                }, {} as Record<string, true>)
              );

              // Validate the update data against the partial schema
              partialSchema.parse(updateData);
            } catch (validationError) {
              throw new Error(
                `Validation error for item with _id ${_id}: ${validationError.message}`
              );
            }
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

          // Return the update operation for bulkWrite
          return {
            updateOne: {
              filter: { _id: plainId },
              update: plainUpdateData,
              upsert: false,
            },
          };
        });

        // Execute bulk write operation
        const result = await this.model.bulkWrite(bulkOps);

        // Process results
        for (let i = 0; i < updateItems.length; i++) {
          const item = updateItems[i];
          const _id = item._id;

          // Find the updated document
          const updatedDoc = await this.model.findById(_id).exec();

          if (updatedDoc) {
            success(item, updatedDoc as unknown as T);
          } else {
            fail(item, { message: `Entity with _id ${_id} not found` });
          }
        }
      } catch (error) {
        // If there's a global error, mark all items as failed
        updateItems.forEach((item) => {
          fail(item, { message: error.message });
        });
      }
    });

    // If input was singular, return the single result
    // Let any errors throw naturally
    if (isSingular) {
      return response.asSingle() as T;
    }

    return response;
  }

  /**
   * Delete one or more entities by ID
   * @param ids Single ID or array of IDs to delete
   * @returns BulkCountedResponse for multiple IDs or true if input was singular and deletion was successful
   */
  /**
   * Delete one or more entities by ID(s)
   * @param ids The ID(s) of the entity/entities to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  /**
   * Delete one or more entities by ID(s)
   * @param ids The ID(s) of the entity/entities to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  async delete(
    ids: string | string[]
  ): Promise<boolean | null | BulkCountedResponse> {
    const isSingular = !Array.isArray(ids);
    const items = isSingular ? [ids] : ids;

    // For singular input, check if entity exists first
    if (isSingular) {
      const entityExists = await this.model.findById(items[0]).exec();
      if (!entityExists) return null;
    }

    // Use BulkOperation.counted for bulk deletion
    const response = await BulkOperation.counted<string>(
      items,
      async (idList) => {
        try {
          // Use deleteMany for bulk deletion
          const result = await this.model
            .deleteMany({ _id: { $in: idList } })
            .exec();
          return result.deletedCount;
        } catch (error) {
          return 0;
        }
      }
    );

    // If input was singular, return true (success) or null (already handled above)
    return isSingular ? true : response;
  }
}
