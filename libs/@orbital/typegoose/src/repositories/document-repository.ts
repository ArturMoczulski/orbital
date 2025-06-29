import {
  BulkCountedResponse,
  BulkItemizedResponse,
  BulkOperation,
} from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import { ReturnModelType } from "@typegoose/typegoose";
import { ZodError, ZodObject } from "zod";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { WithoutId } from "../types/utils";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "../utils/document-helpers";

/**
 * Generic repository for working with domain objects and documents
 * @template TDomainEntity The domain class type (must extend IdentifiableObject)
 * @template TDocumentSchema The Mongoose schema type
 * @template TCreateInput The type for create operations, defaults to Partial<TDomainEntity>
 * @template TModelClass The Typegoose model class type
 */
export class DocumentRepository<
  TDomainEntity extends IdentifiableObject,
  TDocumentSchema extends Document = Document,
  TCreateInput = WithoutId<TDomainEntity>,
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
  async create(
    dto: TCreateInput | TCreateInput[]
  ): Promise<
    | WithDocument<TDomainEntity, TDocumentSchema>
    | BulkItemizedResponse<
        TCreateInput,
        WithDocument<TDomainEntity, TDocumentSchema>
      >
  > {
    const isSingular = !Array.isArray(dto);
    const items = isSingular ? [dto] : dto;

    // Use BulkOperation.itemized for bulk creation
    const response = await BulkOperation.itemized<
      TCreateInput,
      WithDocument<TDomainEntity, TDocumentSchema>
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
              throw new Error(`Validation error: ${validationError.message}`);
            }
          }

          // Convert to domain object if it's not already one
          const domainObject =
            item instanceof this.DomainClass
              ? (item as unknown as TDomainEntity)
              : new this.DomainClass(item as any);

          // Create persistence data from domain object
          const data = PersistenceMapper.toPersistence(domainObject);

          // Store for bulk insertion
          validItems.push(data);
          domainObjects.push(domainObject);
        } catch (error: any) {
          fail(item, { message: error.message });
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
              doc as MongooseDocument & TDocumentSchema
            );

            success(originalItem, withDoc);
          }
        }
      }
    });

    // If input was singular, return the single result
    return isSingular
      ? (response.asSingle() as WithDocument<TDomainEntity, TDocumentSchema>)
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
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema>[]> {
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
        doc as MongooseDocument & TDocumentSchema
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
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema> | null> {
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
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema> | null> {
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
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema>[]> {
    // Check if the schema has a parentId field
    if (this.schema && !this.schema.shape.parentId) {
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
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema>[]> {
    // Check if the schema has a tags field
    if (this.schema && !this.schema.shape.tags) {
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

    return this.find({ tags: { $in: tags } }, projection, options);
  }

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async update(
    entities: TDomainEntity | TDomainEntity[]
  ): Promise<
    | WithDocument<TDomainEntity, TDocumentSchema>
    | null
    | BulkItemizedResponse<
        TDomainEntity,
        WithDocument<TDomainEntity, TDocumentSchema>
      >
  > {
    const isSingular = !Array.isArray(entities);
    const items = isSingular ? [entities] : entities;

    // Use BulkOperation.itemized for bulk updates
    // For singular input, check if entity exists first
    if (isSingular) {
      const entityExists = await this.model.findById(items[0]._id).exec();
      if (!entityExists) return null;
    }

    const response = await BulkOperation.itemized<
      TDomainEntity,
      WithDocument<TDomainEntity, TDocumentSchema>
    >(items, async (updateItems, success, fail) => {
      // Prepare bulk write operations
      const bulkOps: any[] = [];
      const entitiesMap = new Map<string, TDomainEntity>();

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
              throw new Error(`Validation error: ${validationError.message}`);
            }
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
          fail(entity, { message: error.message });
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
          for (const [_id, entity] of entitiesMap.entries()) {
            const updatedDoc = docsById.get(_id);

            if (updatedDoc) {
              // Attach document to domain object
              const withDoc = DocumentHelpers.attachDocument(
                entity,
                updatedDoc as MongooseDocument & TDocumentSchema
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
      return singleResult as WithDocument<TDomainEntity, TDocumentSchema>;
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
}
