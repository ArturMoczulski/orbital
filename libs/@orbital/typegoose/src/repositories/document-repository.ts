import {
  BulkCountedResponse,
  BulkItemizedResponse,
  BulkOperation,
} from "@orbital/bulk-operations";
import {
  ConsoleLogger,
  IdentifiableObject,
  Logger,
  VerbosityLevel,
  ZodErrorWithStack,
} from "@orbital/core";
import { ReturnModelType } from "@typegoose/typegoose";
import { ZodObject } from "zod";
import { getReferences } from "../decorators/reference.decorator";
import { PersistenceMapper } from "../mappers/persistence-mapper";

/**
 * Simple interface for objects with ID
 */
type WithId<T> = T & { _id: string };

/**
 * Simple interface for objects without ID
 */
type WithoutId<T> = Omit<T, "_id">;

/**
 * Interface for model references
 * Keys are reference names, values are model classes
 */
export type ModelReferences<T = {}> = Record<keyof T, any>;

/**
 * Generic repository for working with domain objects and documents
 * @template TDomainEntity The domain class type (must extend IdentifiableObject)
 * @template TDomainEntityProps The props type that the domain entity constructor accepts
 * @template TModelClass The Typegoose model class type
 */
export class DocumentRepository<
  TDomainEntity extends IdentifiableObject,
  TDomainEntityProps,
  TModelClass extends { new (...args: any[]): any } = {
    new (...args: any[]): any;
  },
  TModelReferences = {},
> {
  constructor(
    protected readonly model: ReturnModelType<TModelClass>, // Mongoose Model from Typegoose
    protected readonly DomainClass: new (data: any) => TDomainEntity,
    protected readonly modelReferences?: ModelReferences<TModelReferences>,
    protected readonly schema?: ZodObject<any>,
    protected readonly logger?: Logger
  ) {
    this.logger =
      logger || new ConsoleLogger(VerbosityLevel.INFO, this.constructor.name);
  }

  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns TDomainEntity for single entity or BulkItemizedResponse for multiple entities
   */
  async create(
    dto: WithoutId<TDomainEntityProps> | WithoutId<TDomainEntityProps>[]
  ): Promise<
    | TDomainEntity
    | BulkItemizedResponse<WithoutId<TDomainEntityProps>, TDomainEntity>
  > {
    const isSingular = !Array.isArray(dto);
    const items = isSingular ? [dto] : dto;

    // Use BulkOperation.itemized for bulk creation
    const response = await BulkOperation.itemized<
      WithoutId<TDomainEntityProps>,
      TDomainEntity
    >(items, async (dtos, success, fail) => {
      // Prepare items for bulk insertion
      const validItems: any[] = [];
      const domainObjects: TDomainEntity[] = [];

      // First validate and prepare all items
      for (let i = 0; i < dtos.length; i++) {
        const item = dtos[i];
        try {
          // Validate with Zod schema if provided
          if (this.schema) {
            try {
              // Skip _id validation since it's not required for creation
              const plainObject =
                item &&
                typeof item === "object" &&
                "toPlainObject" in item &&
                typeof item.toPlainObject === "function"
                  ? item.toPlainObject()
                  : { ...item }; // Ensure we have a plain object copy

              const { _id, ...rest } = plainObject;

              // Clone the schema and make _id optional for creation
              const createSchema = this.schema.omit({ _id: true });
              createSchema.parse(rest);
            } catch (validationError: any) {
              // Use ZodErrorWithStack to preserve validation details with stack trace
              throw ZodErrorWithStack.fromError(
                validationError,
                `Validation error during create operation`
              );
            }
          }

          // Validate references if any are defined and modelReferences is provided
          if (this.modelReferences) {
            await this.validateReferences(item);
          }

          // If no _id is provided, we need to create a domain object without an ID
          // First, ensure we have a plain object copy without _id
          const plainItem =
            item &&
            typeof item === "object" &&
            "toPlainObject" in item &&
            typeof item.toPlainObject === "function"
              ? item.toPlainObject()
              : { ...item };

          // Create a domain object without specifying an ID
          // Let MongoDB generate the ID
          const domainObject = new this.DomainClass({
            ...plainItem,
            // Don't set _id here, let MongoDB generate it
          });

          // Create persistence data
          const data = PersistenceMapper.toPersistence(domainObject);

          // Store for bulk insertion
          validItems.push(data);
          domainObjects.push(domainObject);
        } catch (error: any) {
          // Ensure we have a proper error message, even for ZodErrorWithStack
          const errorMessage =
            error instanceof ZodErrorWithStack
              ? `${error.message}\n${error.formatIssues()}`
              : error.message;

          fail(item, { message: errorMessage });
        }
      }

      // If we have valid items, perform bulk insertion
      if (validItems.length > 0) {
        try {
          // Use insertMany for bulk insertion
          const createdDocs = await this.model.insertMany(validItems);

          // Process created documents
          // In MongoDB, insertMany preserves the order of documents
          // So we can match them directly with the domainObjects array
          for (let i = 0; i < createdDocs.length; i++) {
            const doc = createdDocs[i];
            const domainObject = domainObjects[i];
            const originalItem = dtos[i];

            if (domainObject && doc) {
              // Update the domain object with the generated _id if it doesn't have one
              if (!domainObject._id && doc._id) {
                domainObject._id = doc._id;
              }

              // Update the domain object with the generated _id if it doesn't have one
              if (!domainObject._id && doc._id) {
                domainObject._id = doc._id.toString();
              }

              // Create a new domain object with the document data
              const updatedDomainObject = PersistenceMapper.toDomain(
                this.DomainClass,
                doc
              );

              success(originalItem, updatedDomainObject);
            }
          }
        } catch (insertError: unknown) {
          // Extract error message safely from unknown error
          const errorMessage =
            insertError instanceof Error
              ? insertError.message
              : "Unknown error during bulk insertion";

          // If insertMany fails, mark all items as failed
          for (let i = 0; i < dtos.length; i++) {
            const item = dtos[i];
            fail(item, {
              message: `Bulk insertion error: ${errorMessage}`,
            });
          }
        }
      } else {
      }
    });

    // If input was singular, return the single result
    if (isSingular) {
      try {
        const singleResult = response.asSingle() as TDomainEntity;
        return singleResult;
      } catch (error) {
        throw error; // Re-throw to ensure the error is propagated
      }
    } else {
      return response;
    }
  }

  /**
   * Find domain objects by a filter
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities matching the query
   */
  async find(
    // TODO: Replace 'Record<string, any>' with proper FilterQuery type when type issues are resolved
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<TDomainEntity[]> {
    let query = this.model.find(filter, projection);

    if (options) {
      if (options.sort) query = query.sort(options.sort);
      if (options.skip) query = query.skip(options.skip);
      if (options.limit) query = query.limit(options.limit);
      if (options.populate) query = query.populate(options.populate);
    }

    const docs = await query.exec();

    return docs.map((doc: any) => {
      return PersistenceMapper.toDomain(this.DomainClass, doc);
    });
  }

  /**
   * Find a single entity matching the filter criteria
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options (except limit, which is set to 1)
   * @returns The found entity or null if not found
   */
  async findOne(
    // TODO: Replace 'Record<string, any>' with proper FilterQuery type when type issues are resolved
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<TDomainEntity | null> {
    // Create a new options object with limit set to 1
    const findOneOptions = { ...(options || {}), limit: 1 };

    const results = await this.find(filter, projection, findOneOptions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find domain objects by ID(s)
   * @param id The entity ID or array of IDs
   * @param projection Optional fields to project
   * @returns The found entity, array of entities, or null if not found
   */
  async findById(
    id: string | string[],
    projection?: Record<string, any>
  ): Promise<TDomainEntity | TDomainEntity[] | null> {
    const isSingular = !Array.isArray(id);
    const ids = isSingular ? [id] : id;

    const results = await this.find({ _id: { $in: ids } }, projection);

    if (results.length === 0) {
      return null;
    }

    return isSingular ? results[0] : results;
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
  ): Promise<TDomainEntity[]> {
    // Check if the schema has a parentId field
    if (this.schema) {
      try {
        // Try to access the parentId field in the schema
        // This will throw if the field doesn't exist
        this.schema.shape.parentId;
      } catch (error) {
        // Create a new error that will be converted to ZodErrorWithStack
        const schemaError = new Error(
          "Entity schema does not have a parentId field"
        );
        throw ZodErrorWithStack.fromError(
          schemaError,
          "Schema validation error"
        );
      }
    }

    return this.find({ parentId }, projection, options);
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
  ): Promise<TDomainEntity[]> {
    // Check if the schema has a tags field
    if (this.schema) {
      try {
        // Try to access the tags field in the schema
        // This will throw if the field doesn't exist
        this.schema.shape.tags;
      } catch (error) {
        // Create a new error that will be converted to ZodErrorWithStack
        const schemaError = new Error(
          "Entity schema does not have a tags field"
        );
        throw ZodErrorWithStack.fromError(
          schemaError,
          "Schema validation error"
        );
      }
    }

    return this.find({ tags: { $in: tags } }, projection, options);
  }

  /**
   * Update one or more entities
   * @param data Single entity or array of entities with required _id property
   * @returns TDomainEntity for single entity or BulkItemizedResponse for multiple entities
   */
  async update(
    data: WithId<TDomainEntityProps> | WithId<TDomainEntityProps>[]
  ): Promise<
    | TDomainEntity
    | null
    | BulkItemizedResponse<WithId<TDomainEntityProps>, TDomainEntity>
  > {
    const isSingular = !Array.isArray(data);
    const items = isSingular ? [data] : data;

    // Use BulkOperation.itemized for bulk updates
    // For singular input, check if entity exists first
    if (isSingular) {
      const entityExists = await this.model.findById(items[0]._id).exec();
      if (!entityExists) return null;
    }

    const response = await BulkOperation.itemized<
      WithId<TDomainEntityProps>,
      TDomainEntity
    >(items, async (updateItems, success, fail) => {
      // Prepare bulk write operations
      const bulkOps: any[] = [];
      const entitiesMap = new Map<string, WithId<TDomainEntityProps>>();

      // Process each item
      for (const entity of updateItems) {
        try {
          if (!entity._id) {
            fail(entity, {
              message: "Entity must have an _id property for update",
            });
            continue;
          }

          // Validate with Zod schema if provided
          if (this.schema) {
            // Get the entity as a plain object
            const plainObject =
              entity &&
              typeof entity === "object" &&
              "toPlainObject" in entity &&
              typeof entity.toPlainObject === "function"
                ? entity.toPlainObject()
                : { ...entity }; // Ensure we have a plain object copy

            // Validate with the schema
            if (this.schema) {
              try {
                this.schema.parse(plainObject);
              } catch (validationError: any) {
                // Use ZodErrorWithStack to preserve validation details with stack trace
                throw ZodErrorWithStack.fromError(
                  validationError,
                  `Validation error during update operation`
                );
              }
            }
          }

          // Validate references if any are defined and modelReferences is provided
          if (this.modelReferences) {
            await this.validateReferences(entity);
          }

          // Create persistence data from domain object
          const data = PersistenceMapper.toPersistence(entity);
          const { _id, ...updateData } = data;

          // Store entity for later reference
          entitiesMap.set(_id, entity);

          // Add to bulk operations
          bulkOps.push({
            updateOne: {
              filter: { _id },
              update: updateData,
              upsert: false,
            },
          });
        } catch (error: any) {
          // Ensure we have a proper error message, even for ZodErrorWithStack
          const errorMessage =
            error instanceof ZodErrorWithStack
              ? `${error.message}\n${error.formatIssues()}`
              : error.message;

          fail(entity, { message: errorMessage });
        }
      }

      // If we have operations to perform
      if (bulkOps.length > 0) {
        // Execute bulk write operation
        const bulkWriteResult = await this.model.bulkWrite(bulkOps);

        // Check if there were any write errors
        if (
          bulkWriteResult.writeErrors &&
          bulkWriteResult.writeErrors.length > 0
        ) {
          // Mark entities with write errors as failed
          for (const error of bulkWriteResult.writeErrors) {
            const index = error.index;
            if (index !== undefined && index < bulkOps.length) {
              const op = bulkOps[index];
              const id = op.updateOne?.filter?._id;
              if (id && entitiesMap.has(id)) {
                const entity = entitiesMap.get(id);
                if (entity) {
                  fail(entity, {
                    message: error.errmsg || "Write error occurred",
                  });
                  entitiesMap.delete(id);
                }
              }
            }
          }
        }

        // For remaining entities (those without write errors), mark as success
        // We still need to fetch the documents to attach them to the domain objects
        if (entitiesMap.size > 0) {
          const ids = Array.from(entitiesMap.keys());

          // Fetch all updated documents in a single query
          const updatedDocs = await this.model
            .find({ _id: { $in: ids } })
            .exec();

          // Create a map of documents by ID for quick lookup
          const docsById = new Map();
          updatedDocs.forEach((doc: any) => {
            docsById.set(doc._id.toString(), doc);
          });

          // Process results - match entities with their updated documents
          // Convert Map entries to array to avoid downlevelIteration issues
          for (const [_id, entity] of Array.from(entitiesMap.entries())) {
            const updatedDoc = docsById.get(_id);

            if (updatedDoc) {
              // Create a new domain object with the updated document data
              const updatedDomainObject = PersistenceMapper.toDomain(
                this.DomainClass,
                updatedDoc
              );

              success(entity, updatedDomainObject);
            } else {
              fail(entity, {
                message: `Entity with _id ${_id} not found after update`,
              });
            }
          }
        }
      }
    });

    // If input was singular, return the single result or null if not found
    if (isSingular) {
      // Check if there was a failure and the entity wasn't found
      const singleResult = response.asSingle();
      if (!singleResult || (response.counts && response.counts.fail > 0)) {
        return null;
      }
      return singleResult as TDomainEntity;
    }

    return response;
  }

  /**
   * Delete one or more entities by ID
   * @param ids Single ID or array of IDs to delete
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
        // Use deleteMany for bulk deletion
        const result = await this.model
          .deleteMany({ _id: { $in: idList } })
          .exec();
        return result.deletedCount;
      }
    );

    // If input was singular, return true (success) or null (already handled above)
    return isSingular ? true : response;
  }

  /**
   * Validates that objects referenced by the entity from other collections exist
   * @param entity The entity to validate references for
   * @throws Error if a referenced entity doesn't exist
   */
  protected async validateReferences(entity: any): Promise<void> {
    if (!this.modelReferences) {
      return; // Skip validation if no model references provided
    }

    // Get reference metadata for the domain class
    const references = getReferences(this.DomainClass);

    if (!references || references.length === 0) {
      return; // No references to validate
    }

    // Check each reference
    for (const reference of references) {
      const { propertyKey, collection, required, foreignField, name } =
        reference;

      // Get the reference value
      const value = entity[propertyKey];

      // If the reference is required but the value is null/undefined, throw an error
      if (required && (value === null || value === undefined)) {
        throw new Error(
          `Required reference ${collection}.${foreignField} is missing for property "${propertyKey}"`
        );
      }

      // Skip if the field is not required and the value is null/undefined
      if (!required && (value === null || value === undefined)) {
        continue;
      }

      // Get the model for this reference
      const referenceModel = this.modelReferences
        ? (this.modelReferences as any)[name]
        : undefined;

      // If no model is provided for this reference but a value is provided,
      // throw an error because we can't validate against a non-existent collection
      if (!referenceModel && value !== null && value !== undefined) {
        throw new Error(
          `Cannot validate reference to ${collection}.${foreignField} with value "${value}" because the model is not available`
        );
      }

      // Skip if no model is provided for this reference (and no value is provided)
      if (!referenceModel) {
        continue;
      }

      // Check if the referenced entity exists
      const filter: Record<string, any> = {};
      filter[foreignField] = value;

      try {
        if (typeof referenceModel.exists !== "function") {
          throw new Error(
            `referenceModel.exists is not a function for model: ${name}`
          );
        }

        const exists = await referenceModel.exists(filter);

        if (!exists) {
          throw new Error(
            `Referenced entity not found: ${collection}.${foreignField} with value "${value}"`
          );
        }
      } catch (error) {
        throw error; // Re-throw to ensure the error is propagated
      }
    }
  }
}
