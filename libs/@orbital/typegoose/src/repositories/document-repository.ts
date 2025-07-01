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
  WithoutId,
  ZodErrorWithStack,
} from "@orbital/core";
import { ReturnModelType } from "@typegoose/typegoose";
import { ZodObject } from "zod";
import { getReferences } from "../decorators/reference.decorator";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { WithId } from "../types/utils";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "../utils/document-helpers";

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
    console.log(`[DocumentRepository.create] Starting create operation`);
    console.log(
      `[DocumentRepository.create] Input:`,
      JSON.stringify(dto, null, 2)
    );

    const isSingular = !Array.isArray(dto);
    console.log(`[DocumentRepository.create] isSingular: ${isSingular}`);

    const items = isSingular ? [dto] : dto;
    console.log(
      `[DocumentRepository.create] Number of items to create: ${items.length}`
    );

    // Use BulkOperation.itemized for bulk creation
    console.log(`[DocumentRepository.create] Starting BulkOperation.itemized`);
    const response = await BulkOperation.itemized<
      WithoutId<TDomainEntityProps>,
      WithDocument<TDomainEntity>
    >(items, async (dtos, success, fail) => {
      console.log(
        `[DocumentRepository.create] Inside bulk operation callback with ${dtos.length} items`
      );

      // Prepare items for bulk insertion
      const validItems: any[] = [];
      const domainObjects: TDomainEntity[] = [];

      console.log(
        `[DocumentRepository.create] Starting validation and preparation of items`
      );
      // First validate and prepare all items
      for (let i = 0; i < dtos.length; i++) {
        console.log(
          `[DocumentRepository.create] Processing item ${i + 1}/${dtos.length}`
        );
        const item = dtos[i];
        try {
          // Validate with Zod schema if provided
          if (this.schema) {
            console.log(
              `[DocumentRepository.create] Schema validation for item ${i + 1}`
            );
            try {
              // Skip _id validation since it's not required for creation
              const plainObject =
                item &&
                typeof item === "object" &&
                "toPlainObject" in item &&
                typeof item.toPlainObject === "function"
                  ? item.toPlainObject()
                  : { ...item }; // Ensure we have a plain object copy

              console.log(
                `[DocumentRepository.create] Item ${i + 1} converted to plain object`
              );
              const { _id, ...rest } = plainObject;

              // Clone the schema and make _id optional for creation
              const createSchema = this.schema.omit({ _id: true });
              console.log(
                `[DocumentRepository.create] Parsing item ${i + 1} with schema`
              );
              createSchema.parse(rest);
              console.log(
                `[DocumentRepository.create] Item ${i + 1} passed schema validation`
              );
            } catch (validationError: any) {
              console.error(
                `[DocumentRepository.create] Schema validation error for item ${i + 1}:`,
                validationError
              );
              // Use ZodErrorWithStack to preserve validation details with stack trace
              throw ZodErrorWithStack.fromError(
                validationError,
                `Validation error during create operation`
              );
            }
          }

          // Validate references if any are defined and modelReferences is provided
          if (this.modelReferences) {
            console.log(
              `[DocumentRepository.create] Starting reference validation for item ${i + 1}`
            );
            await this.validateReferences(item);
            console.log(
              `[DocumentRepository.create] Reference validation passed for item ${i + 1}`
            );
          }

          // If no _id is provided, we need to create a domain object without an ID
          // First, ensure we have a plain object copy without _id
          console.log(
            `[DocumentRepository.create] Preparing plain item for domain object creation`
          );
          const plainItem =
            item &&
            typeof item === "object" &&
            "toPlainObject" in item &&
            typeof item.toPlainObject === "function"
              ? item.toPlainObject()
              : { ...item };

          // Create a domain object without specifying an ID
          // Let MongoDB generate the ID
          console.log(
            `[DocumentRepository.create] Creating domain object for item ${i + 1}`
          );
          const domainObject = new this.DomainClass({
            ...plainItem,
            // Don't set _id here, let MongoDB generate it
          });
          console.log(
            `[DocumentRepository.create] Domain object created for item ${i + 1}:`,
            JSON.stringify(
              domainObject,
              (key, value) => (key === "_document" ? undefined : value),
              2
            )
          );

          // Create persistence data
          console.log(
            `[DocumentRepository.create] Converting domain object to persistence data for item ${i + 1}`
          );
          const data = PersistenceMapper.toPersistence(domainObject);
          console.log(
            `[DocumentRepository.create] Persistence data created for item ${i + 1}:`,
            JSON.stringify(data, null, 2)
          );

          // Store for bulk insertion
          validItems.push(data);
          domainObjects.push(domainObject);
          console.log(
            `[DocumentRepository.create] Item ${i + 1} is valid and ready for insertion`
          );
        } catch (error: any) {
          console.error(
            `[DocumentRepository.create] Error processing item ${i + 1}:`,
            error
          );
          // Ensure we have a proper error message, even for ZodErrorWithStack
          const errorMessage =
            error instanceof ZodErrorWithStack
              ? `${error.message}\n${error.formatIssues()}`
              : error.message;

          console.log(
            `[DocumentRepository.create] Marking item ${i + 1} as failed: ${errorMessage}`
          );
          fail(item, { message: errorMessage });
        }
      }

      console.log(
        `[DocumentRepository.create] Validation complete. Valid items: ${validItems.length}, Invalid items: ${dtos.length - validItems.length}`
      );

      // If we have valid items, perform bulk insertion
      if (validItems.length > 0) {
        console.log(
          `[DocumentRepository.create] Starting bulk insertion of ${validItems.length} items`
        );
        try {
          // Use insertMany for bulk insertion
          console.log(
            `[DocumentRepository.create] Calling model.insertMany with ${validItems.length} items`
          );
          const createdDocs = await this.model.insertMany(validItems);
          console.log(
            `[DocumentRepository.create] Bulk insertion successful. Created ${createdDocs.length} documents`
          );

          // Process created documents
          // In MongoDB, insertMany preserves the order of documents
          // So we can match them directly with the domainObjects array
          console.log(
            `[DocumentRepository.create] Processing created documents`
          );
          for (let i = 0; i < createdDocs.length; i++) {
            const doc = createdDocs[i];
            const domainObject = domainObjects[i];
            const originalItem = dtos[i];

            console.log(
              `[DocumentRepository.create] Processing created document ${i + 1}/${createdDocs.length}`
            );
            console.log(`[DocumentRepository.create] Document _id: ${doc._id}`);

            if (domainObject && doc) {
              // Update the domain object with the generated _id if it doesn't have one
              if (!domainObject._id && doc._id) {
                console.log(
                  `[DocumentRepository.create] Updating domain object with generated _id: ${doc._id}`
                );
                domainObject._id = doc._id;
              }

              // Attach document to domain object
              console.log(
                `[DocumentRepository.create] Attaching document to domain object`
              );
              const withDoc = DocumentHelpers.attachDocument(
                domainObject,
                doc as MongooseDocument & Document
              );

              console.log(
                `[DocumentRepository.create] Marking item ${i + 1} as successful`
              );
              success(originalItem, withDoc);
            } else {
              console.warn(
                `[DocumentRepository.create] Missing domain object or document for item ${i + 1}`
              );
            }
          }
        } catch (insertError: unknown) {
          console.error(
            `[DocumentRepository.create] Error during bulk insertion:`,
            insertError
          );

          // Extract error message safely from unknown error
          const errorMessage =
            insertError instanceof Error
              ? insertError.message
              : "Unknown error during bulk insertion";

          console.log(
            `[DocumentRepository.create] Marking all items as failed with error: ${errorMessage}`
          );

          // If insertMany fails, mark all items as failed
          for (let i = 0; i < dtos.length; i++) {
            const item = dtos[i];
            fail(item, {
              message: `Bulk insertion error: ${errorMessage}`,
            });
          }
        }
      } else {
        console.log(`[DocumentRepository.create] No valid items to insert`);
      }
    });

    console.log(`[DocumentRepository.create] BulkOperation complete`);
    console.log(
      `[DocumentRepository.create] Response counts:`,
      response.counts
    );

    // If input was singular, return the single result
    if (isSingular) {
      console.log(
        `[DocumentRepository.create] Converting bulk response to single result`
      );
      console.log(
        `[DocumentRepository.create] Response status: ${response.status}, counts:`,
        response.counts
      );
      console.log(
        `[DocumentRepository.create] Success items: ${response.items.success.length}, Fail items: ${response.items.fail.length}`
      );

      if (response.items.fail.length > 0) {
        console.log(
          `[DocumentRepository.create] Failed items:`,
          JSON.stringify(response.items.fail, null, 2)
        );
      }

      try {
        console.log(`[DocumentRepository.create] Calling response.asSingle()`);
        const singleResult = response.asSingle() as WithDocument<TDomainEntity>;
        console.log(
          `[DocumentRepository.create] Single result:`,
          JSON.stringify(
            singleResult,
            (key, value) => (key === "_document" ? undefined : value),
            2
          )
        );
        return singleResult;
      } catch (error) {
        console.error(
          `[DocumentRepository.create] Error in asSingle():`,
          error
        );
        throw error; // Re-throw to ensure the error is propagated
      }
    } else {
      console.log(`[DocumentRepository.create] Returning bulk response`);
      return response;
    }
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
  ): Promise<WithDocument<TDomainEntity>[]> {
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

          this.logger?.log(`updated docs: `, updatedDocs);

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
   * Validates that objects referenced by the entity from other collections exist
   * @param entity The entity to validate references for
   * @throws Error if a referenced entity doesn't exist
   */
  protected async validateReferences(entity: any): Promise<void> {
    console.log(
      `[validateReferences] Starting reference validation for entity:`,
      JSON.stringify(entity, null, 2)
    );

    if (!this.modelReferences) {
      console.log(
        `[validateReferences] No model references provided, skipping validation`
      );
      return; // Skip validation if no model references provided
    }

    // Get reference metadata for the domain class
    console.log(
      `[validateReferences] Getting references for domain class: ${this.DomainClass.name}`
    );
    const references = getReferences(this.DomainClass);
    console.log(
      `[validateReferences] References:`,
      JSON.stringify(references, null, 2)
    );

    if (!references || references.length === 0) {
      console.log(`[validateReferences] No references to validate`);
      return; // No references to validate
    }

    // Check each reference
    for (const reference of references) {
      const { propertyKey, collection, required, foreignField, name } =
        reference;
      console.log(
        `[validateReferences] Validating reference: ${name}, property: ${propertyKey}, collection: ${collection}, foreignField: ${foreignField}, required: ${required}`
      );

      // Skip if the field is not required and the value is null/undefined
      const value = entity[propertyKey];
      console.log(`[validateReferences] Reference value:`, value);

      if (!required && (value === null || value === undefined)) {
        console.log(
          `[validateReferences] Reference is not required and value is null/undefined, skipping`
        );
        continue;
      }

      // Skip if the value is not present in the entity
      if (value === undefined) {
        console.log(`[validateReferences] Value is undefined, skipping`);
        continue;
      }

      // Get the model for this reference
      console.log(`[validateReferences] Getting reference model for: ${name}`);
      console.log(
        `[validateReferences] Available model references:`,
        Object.keys(this.modelReferences || {})
      );

      const referenceModel = this.modelReferences
        ? (this.modelReferences as any)[name]
        : undefined;
      console.log(
        `[validateReferences] Reference model:`,
        referenceModel ? "Found" : "Not found"
      );

      // If no model is provided for this reference but a value is provided,
      // throw an error because we can't validate against a non-existent collection
      if (!referenceModel && value !== null && value !== undefined) {
        console.error(
          `[validateReferences] ERROR: Cannot validate reference because model is not available`
        );
        throw new Error(
          `Cannot validate reference to ${collection}.${foreignField} with value "${value}" because the model is not available`
        );
      }

      // Skip if no model is provided for this reference (and no value is provided)
      if (!referenceModel) {
        console.log(
          `[validateReferences] No reference model and no value, skipping`
        );
        continue;
      }

      // Check if the referenced entity exists
      const filter: Record<string, any> = {};
      filter[foreignField] = value;
      console.log(
        `[validateReferences] Checking if referenced entity exists with filter:`,
        filter
      );

      try {
        console.log(
          `[validateReferences] Calling referenceModel.exists with filter:`,
          filter
        );
        console.log(
          `[validateReferences] referenceModel methods:`,
          Object.keys(referenceModel).join(", ")
        );

        if (typeof referenceModel.exists !== "function") {
          console.error(
            `[validateReferences] ERROR: referenceModel.exists is not a function`
          );
          console.error(`[validateReferences] referenceModel:`, referenceModel);
          throw new Error(
            `referenceModel.exists is not a function for model: ${name}`
          );
        }

        const exists = await referenceModel.exists(filter);
        console.log(`[validateReferences] Exists result:`, exists);

        if (!exists) {
          console.error(
            `[validateReferences] ERROR: Referenced entity not found`
          );
          throw new Error(
            `Referenced entity not found: ${collection}.${foreignField} with value "${value}"`
          );
        }

        console.log(
          `[validateReferences] Reference validation successful for: ${name}`
        );
      } catch (error) {
        console.error(`[validateReferences] ERROR during exists check:`, error);
        throw error; // Re-throw to ensure the error is propagated
      }
    }

    console.log(`[validateReferences] All references validated successfully`);
  }
}
