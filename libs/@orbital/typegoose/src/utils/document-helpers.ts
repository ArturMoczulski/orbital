import { IdentifiableObject } from "@orbital/core";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { MongooseDocument, WithDocument } from "../types/with-document";

/**
 * Helper functions for working with domain objects that have documents attached
 */
export class DocumentHelpers {
  /**
   * Attach a Mongoose document to a domain object
   */
  static attachDocument<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document,
  >(
    domainObject: TDomainEntity,
    document: MongooseDocument & TDocumentSchema
  ): WithDocument<TDomainEntity, TDocumentSchema> {
    (domainObject as WithDocument<TDomainEntity, TDocumentSchema>).document =
      document;
    return domainObject as WithDocument<TDomainEntity, TDocumentSchema>;
  }

  /**
   * Save the document attached to a domain object
   */
  static async save<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document,
  >(
    obj: WithDocument<TDomainEntity, TDocumentSchema>
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema>> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    // Update document with latest domain object data
    const data = PersistenceMapper.toPersistence(obj);
    Object.assign(obj.document, data);

    await obj.document.save();
    return obj;
  }

  /**
   * Populate a reference field in the document
   */
  static async populate<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document,
  >(
    obj: WithDocument<TDomainEntity, TDocumentSchema>,
    path: string
  ): Promise<WithDocument<TDomainEntity, TDocumentSchema>> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    await obj.document.populate(path);
    return obj;
  }

  /**
   * Remove the document from the database
   */
  static async remove<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document,
  >(obj: WithDocument<TDomainEntity, TDocumentSchema>): Promise<void> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    await obj.document.remove();
  }

  /**
   * Check if a domain object has a document attached
   */
  static hasDocument<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document,
  >(obj: WithDocument<TDomainEntity, TDocumentSchema>): boolean {
    return !!obj.document;
  }

  /**
   * Create a new domain object with document attached
   */
  static createWithDocument<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document,
    Args extends any[],
  >(
    DomainClass: new (...args: Args) => TDomainEntity,
    document: MongooseDocument & TDocumentSchema,
    constructorArgs: Args
  ): WithDocument<TDomainEntity, TDocumentSchema> {
    const domainObject = new DomainClass(...constructorArgs);
    return this.attachDocument(domainObject, document);
  }
}
