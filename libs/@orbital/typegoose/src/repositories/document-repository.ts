import {
  BulkCountedResponse,
  BulkItemizedResponse,
  BulkOperation,
} from "@orbital/bulk-operations";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  WithoutId,
  ZodErrorWithStack,
} from "@orbital/core";
import { ReturnModelType } from "@typegoose/typegoose";
import { ZodError, ZodObject } from "zod";
import { getReferences } from "../decorators/reference.decorator";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { WithId } from "../types/utils";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "../utils/document-helpers";

/**
 * Generic repository for working with domain objects and documents
 * @template TDomainEntity The domain class type (must extend IdentifiableObject)
 * @template TDomainEntityProps The props type that the domain entity constructor accepts
 * @template TModelClass The Typegoose model class type
 */
export class DocumentRepository<
  TDomainEntity extends IdentifiableObject,
  TDomainEntityProps = IdentifiableObjectProps,
  TModelClass extends { new (...args: any[]): any } = {
    new (...args: any[]): any;
  },
> {
  constructor(
    protected readonly model: ReturnModelType<TModelClass>, // Mongoose Model from Typegoose
    protected readonly DomainClass: new (data: any) => TDomainEntity,
    protected readonly schema?: ZodObject<any>
  ) {}

  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async create(
    dto: WithoutId<TDomainEntityProps> | WithoutId<TDomainEntityProps>[]
  ): Promise<
    | WithDocument<TDomainEntity>
    | BulkItemizedResponse<
        WithoutId<TDomainEntityProps>,
        WithDocument<TDomainEntity>
      >
  > {
    const isSingular = !Array.isArray(dto);
    const items = isSingular ? [dto] : dto;

    // Use BulkOperation.itemized for bulk creation
    const response = await BulkOperation.itemized<
      WithoutId<TDomainEntityProps>,
      WithDocument<TDomainEntity>
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

          // Validate references if any are defined
          await this.validateReferences(item);

          // Convert to domain object if it's not already one
          const domainObject =
            item instanceof this.DomainClass
              ? (item as unknown as TDomainEntity)
              : new this.DomainClass(item as any);

          // Create persistence data from domain object
          const data = PersistenceMapper.toPersistence(domainObject);

          // If _id is provided, use it; otherwise, let MongoDB generate one
          if (data._id) {
            // Store for bulk insertion with the provided _id
            validItems.push(data);
          } else {
            // Remove the temporary ID to let MongoDB generate a new one
            const { _id, ...dataWithoutId } = data;

            // Store for bulk insertion without _id
            validItems.push(dataWithoutId);
          }
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

            // Attach document to domain object
            const withDoc = DocumentHelpers.attachDocument(
              domainObject,
              doc as MongooseDocument & Document
            );

            success(originalItem, withDoc);
          }
        }
      }
    });

    // If input was singular, return the single result
    return isSingular
      ? (response.asSingle() as WithDocument<TDomainEntity>)
      : response;
  }

  /**
   * Find domain objects by a filter with documents attached
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options
   * @returns Array of entities matching the query with documents attached
   */
  async find(
    // TODO: Replace 'Record<string, any>' with proper FilterQuery type when type issues are resolved
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<WithDocument<TDomainEntity>[]> {
    let query = this.model.find(filter, projection);

    if (options) {
      if (options.sort) query = query.sort(options.sort);
      if (options.skip) query = query.skip(options.skip);
      if (options.limit) query = query.limit(options.limit);
      if (options.populate) query = query.populate(options.populate);
    }

    const docs = await query.exec();

    return docs.map((doc: any) => {
      const domainObject = PersistenceMapper.toDomain(this.DomainClass, doc);
      return DocumentHelpers.attachDocument(
        domainObject,
        doc as MongooseDocument & Document
      );
    });
  }

  /**
   * Find a single entity matching the filter criteria
   * @param filter Query filter criteria
   * @param projection Optional fields to project
   * @param options Optional query options (except limit, which is set to 1)
   * @returns The found entity with document attached or null if not found
   */
  async findOne(
    // TODO: Replace 'Record<string, any>' with proper FilterQuery type when type issues are resolved
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<WithDocument<TDomainEntity> | null> {
    // Create a new options object with limit set to 1
    const findOneOptions = { ...(options || {}), limit: 1 };

    const results = await this.find(filter, projection, findOneOptions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find a domain object by ID with document attached
   * @param id The entity ID
   * @param projection Optional fields to project
   * @returns The found entity with document attached or null
   */
  async findById(
    id: string,
    projection?: Record<string, any>
  ): Promise<WithDocument<TDomainEntity> | null> {
    return this.findOne({ _id: id }, projection);
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
  ): Promise<WithDocument<TDomainEntity>[]> {
    // Check if the schema has a parentId field
    if (this.schema && !this.schema.shape.parentId) {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "object",
          received: "undefined",
          path: ["parentId"],
          message: "Entity schema does not have a parentId field",
        },
      ]);
      throw new ZodErrorWithStack(zodError);
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
  ): Promise<WithDocument<TDomainEntity>[]> {
    // Check if the schema has a tags field
    if (this.schema && !this.schema.shape.tags) {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "object",
          received: "undefined",
          path: ["tags"],
          message: "Entity schema does not have a tags field",
        },
      ]);
      throw new ZodErrorWithStack(zodError);
    }

    return this.find({ tags: { $in: tags } }, projection, options);
  }

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  /**
   * Update one or more entities
   * @param data Single entity or array of entities with required _id property
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async update(
    data: WithId<TDomainEntityProps> | WithId<TDomainEntityProps>[]
  ): Promise<
    | WithDocument<TDomainEntity>
    | null
    | BulkItemizedResponse<
        WithId<TDomainEntityProps>,
        WithDocument<TDomainEntity>
      >
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
      WithDocument<TDomainEntity>
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
            try {
              // Get the entity as a plain object
              const plainObject =
                entity &&
                typeof entity === "object" &&
                "toPlainObject" in entity &&
                typeof entity.toPlainObject === "function"
                  ? entity.toPlainObject()
                  : { ...entity }; // Ensure we have a plain object copy

              // Create a partial schema that only validates the fields being updated
              const updateFields = Object.keys(plainObject).filter(
                (key) => key !== "_id"
              );

              if (updateFields.length > 0) {
                const partialSchema = this.schema.partial().pick(
                  updateFields.reduce(
                    (acc, field) => {
                      acc[field] = true;
                      return acc;
                    },
                    {} as Record<string, true>
                  )
                );

                // Validate the update data against the partial schema
                partialSchema.parse(plainObject);
              }
            } catch (validationError: any) {
              // Use ZodErrorWithStack to preserve validation details with stack trace
              throw ZodErrorWithStack.fromError(
                validationError,
                `Validation error during update operation`
              );
            }
          }

          // Validate references if any are defined
          await this.validateReferences(entity);

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
              // Attach document to domain object
              const withDoc = DocumentHelpers.attachDocument(
                entity as unknown as TDomainEntity,
                updatedDoc as MongooseDocument & Document
              );

              success(entity, withDoc);
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
      return singleResult as WithDocument<TDomainEntity>;
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
   * Validates that all references in an entity exist in their respective collections
   * @param entity The entity to validate references for
   * @throws Error if a referenced entity doesn't exist
   */
  private async validateReferences(entity: any): Promise<void> {
    // Skip validation if entity is not an object
    if (!entity || typeof entity !== "object") {
      return;
    }

    // Get the domain class constructor
    const DomainClass = this.DomainClass;

    // Get reference metadata from the domain class
    const references = getReferences(DomainClass);

    // If no references are defined, skip validation
    if (!references || references.length === 0) {
      return;
    }

    console.log(
      `[validateReferences] Validating references for ${DomainClass.name}`
    );
    console.log(`[validateReferences] Entity: ${JSON.stringify(entity)}`);
    console.log(
      `[validateReferences] References: ${JSON.stringify(references)}`
    );

    // Validate each reference
    for (const reference of references) {
      const { propertyKey, collection, required, foreignField } = reference;

      // Skip if the reference is not required and the value is not provided
      if (
        !required &&
        (entity[propertyKey] === undefined || entity[propertyKey] === null)
      ) {
        console.log(
          `[validateReferences] Skipping optional reference ${propertyKey} (not provided)`
        );
        continue;
      }

      // Skip if the value is not provided (this will be caught by schema validation if required)
      if (entity[propertyKey] === undefined || entity[propertyKey] === null) {
        console.log(
          `[validateReferences] Skipping reference ${propertyKey} (not provided)`
        );
        continue;
      }

      // Get the referenced value
      const referencedValue = entity[propertyKey];

      // Skip empty values
      if (referencedValue === "") {
        console.log(
          `[validateReferences] Skipping reference ${propertyKey} (empty string)`
        );
        continue;
      }

      console.log(
        `[validateReferences] Validating reference ${propertyKey} = "${referencedValue}" to collection "${collection}"`
      );

      // Check if the collection exists in the database
      const collectionExists =
        this.model.db.collections && collection in this.model.db.collections;

      console.log(
        `[validateReferences] Collection "${collection}" exists: ${collectionExists}`
      );
      console.log(
        `[validateReferences] Available collections: ${Object.keys(this.model.db.collections || {}).join(", ")}`
      );

      try {
        // Get the model for the referenced collection
        console.log(
          `[validateReferences] Attempting to get model for collection "${collection}"`
        );
        const referencedModel = this.model.db.model(collection);
        console.log(
          `[validateReferences] Successfully got model for collection "${collection}"`
        );

        // Check if the referenced entity exists
        const filter: Record<string, any> = {};
        filter[foreignField] = referencedValue;
        console.log(
          `[validateReferences] Checking if entity exists with filter: ${JSON.stringify(filter)}`
        );

        const exists = await referencedModel.exists(filter);
        console.log(`[validateReferences] Entity exists: ${!!exists}`);

        if (!exists) {
          console.log(
            `[validateReferences] Referenced entity not found in collection "${collection}"`
          );
          throw new Error(
            `Referenced entity not found: ${collection}.${foreignField} with value "${referencedValue}"`
          );
        }

        console.log(
          `[validateReferences] Successfully validated reference to ${collection}.${foreignField}`
        );
      } catch (error: any) {
        console.log(
          `[validateReferences] Error validating reference: ${error.name} - ${error.message}`
        );

        // If the model doesn't exist but the collection does exist in the database,
        // try to query the collection directly using the native MongoDB API
        if (error.name === "MissingSchemaError" && collectionExists) {
          console.log(
            `[validateReferences] Model not registered but collection exists, trying native MongoDB API`
          );
          try {
            // Access the collection directly without a model
            const nativeCollection = this.model.db.collection(collection);
            console.log(
              `[validateReferences] Got native collection for "${collection}"`
            );

            // Create a filter to check if the referenced entity exists
            const filter: Record<string, any> = {};
            filter[foreignField] = referencedValue;
            console.log(
              `[validateReferences] Querying native collection with filter: ${JSON.stringify(filter)}`
            );

            // Query the collection directly
            const doc = await nativeCollection.findOne(filter);
            console.log(`[validateReferences] Native query result: ${!!doc}`);

            if (!doc) {
              console.log(
                `[validateReferences] Referenced entity not found in native collection`
              );
              throw new Error(
                `Referenced entity not found: ${collection}.${foreignField} with value "${referencedValue}"`
              );
            }

            // If we get here, the reference is valid
            console.log(
              `[validateReferences] Validated reference to ${collection}.${foreignField} with value "${referencedValue}" using native collection API`
            );
            continue;
          } catch (collectionError: any) {
            console.log(
              `[validateReferences] Error querying native collection: ${collectionError.message}`
            );
            // If we can't query the collection directly, throw a more informative error
            throw new Error(
              `Cannot validate reference to ${collection}.${foreignField} with value "${referencedValue}". ` +
                `Collection exists but schema is not registered and direct query failed: ${collectionError.message}`
            );
          }
        }

        // If the model doesn't exist and the collection doesn't exist either,
        // this is a real error that should be reported
        if (error.name === "MissingSchemaError") {
          console.log(
            `[validateReferences] Collection "${collection}" does not exist or is not accessible`
          );
          throw new Error(
            `Cannot validate reference to ${collection}.${foreignField} with value "${referencedValue}". ` +
              `Collection "${collection}" does not exist or is not accessible.`
          );
        }

        // Re-throw other errors
        console.log(`[validateReferences] Re-throwing error: ${error.message}`);
        throw error;
      }
    }

    console.log(`[validateReferences] All references validated successfully`);
  }
}
