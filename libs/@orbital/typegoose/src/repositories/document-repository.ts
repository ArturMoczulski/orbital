import {
  BulkCountedResponse,
  BulkItemizedResponse,
  BulkOperation,
} from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "../utils/document-helpers";

// Import types from @types/mongoose

/**
 * Generic repository for working with domain objects and documents
 * @template T The domain class type (must extend IdentifiableObject)
 * @template S The Mongoose schema type
 * @template TCreateInput The type for create operations, defaults to Partial<T>
 */
export class DocumentRepository<
  T extends IdentifiableObject,
  S = any,
  TCreateInput = Partial<T>,
> {
  constructor(
    // TODO: Replace 'any' with proper Mongoose Model type when type issues are resolved
    protected readonly model: any, // Mongoose Model
    protected readonly DomainClass: new (data: any) => T
  ) {}

  /**
   * Create one or more entities
   * @param dto Single entity or array of entities to create
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async create(
    dto: TCreateInput | TCreateInput[]
  ): Promise<
    WithDocument<T, S> | BulkItemizedResponse<TCreateInput, WithDocument<T, S>>
  > {
    const isSingular = !Array.isArray(dto);
    const items = isSingular ? [dto] : dto;

    // Use BulkOperation.itemized for bulk creation
    const response = await BulkOperation.itemized<
      TCreateInput,
      WithDocument<T, S>
    >(items, async (dtos, success, fail) => {
      try {
        // Process each item
        for (const item of dtos) {
          try {
            // Convert to domain object if it's not already one
            const domainObject =
              item instanceof this.DomainClass
                ? (item as unknown as T)
                : new this.DomainClass(item as any);

            // Create document from domain object
            const data = PersistenceMapper.toPersistence(domainObject);
            const doc = new this.model(data);

            // Attach document to domain object
            const withDoc = DocumentHelpers.attachDocument(
              domainObject,
              doc as MongooseDocument & S
            );

            // Save the document
            await doc.save();

            success(item, withDoc);
          } catch (error: any) {
            fail(item, { message: error.message });
          }
        }
      } catch (error: any) {
        // If there's a global error, mark all items as failed
        dtos.forEach((item) => {
          fail(item, { message: error.message });
        });
      }
    });

    // If input was singular, return the single result
    return isSingular ? (response.asSingle() as WithDocument<T, S>) : response;
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
  ): Promise<WithDocument<T, S>[]> {
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
        doc as MongooseDocument & S
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
  ): Promise<WithDocument<T, S> | null> {
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
  ): Promise<WithDocument<T, S> | null> {
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
  ): Promise<WithDocument<T, S>[]> {
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
  ): Promise<WithDocument<T, S>[]> {
    return this.find({ tags: { $in: tags } }, projection, options);
  }

  /**
   * Update one or more entities
   * @param entities Single entity or array of entities with required _id property
   * @returns WithDocument<T> for single entity or BulkItemizedResponse for multiple entities
   */
  async update(
    entities: T | T[]
  ): Promise<
    WithDocument<T, S> | null | BulkItemizedResponse<T, WithDocument<T, S>>
  > {
    const isSingular = !Array.isArray(entities);
    const items = isSingular ? [entities] : entities;

    // Use BulkOperation.itemized for bulk updates
    // For singular input, check if entity exists first
    if (isSingular) {
      const entityExists = await this.model.findById(items[0]._id).exec();
      if (!entityExists) return null;
    }

    const response = await BulkOperation.itemized<T, WithDocument<T, S>>(
      items,
      async (updateItems, success, fail) => {
        try {
          // Process each item
          for (const entity of updateItems) {
            try {
              if (!entity._id) {
                throw new Error("Entity must have an _id property for update");
              }

              // Find existing document
              const existingDoc = await this.model.findById(entity._id).exec();
              if (!existingDoc) {
                fail(entity, {
                  message: `Entity with _id ${entity._id} not found`,
                });
                continue;
              }

              // Update document with current domain data
              const data = PersistenceMapper.toPersistence(entity);
              Object.assign(existingDoc, data);

              // Save the document
              await existingDoc.save();

              // Attach document to domain object
              const withDoc = DocumentHelpers.attachDocument(
                entity,
                existingDoc as MongooseDocument & S
              );

              success(entity, withDoc);
            } catch (error: any) {
              fail(entity, { message: error.message });
            }
          }
        } catch (error: any) {
          // If there's a global error, mark all items as failed
          updateItems.forEach((item) => {
            fail(item, { message: error.message });
          });
        }
      }
    );

    // If input was singular, return the single result or null if not found
    if (isSingular) {
      // Check if there was a failure and the entity wasn't found
      const singleResult = response.asSingle();
      if (!singleResult || (response.counts && response.counts.fail > 0)) {
        return null;
      }
      return singleResult as WithDocument<T, S>;
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
        try {
          // Use deleteMany for bulk deletion
          const result = await this.model
            .deleteMany({ _id: { $in: idList } })
            .exec();
          return result.deletedCount;
        } catch (error: any) {
          return 0;
        }
      }
    );

    // If input was singular, return true (success) or null (already handled above)
    return isSingular ? true : response;
  }
}
