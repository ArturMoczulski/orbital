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
  static attachDocument<TDomainEntity extends IdentifiableObject>(
    domainObject: TDomainEntity,
    document: MongooseDocument & Document
  ): WithDocument<TDomainEntity> {
    (domainObject as WithDocument<TDomainEntity>).document = document;
    return domainObject as WithDocument<TDomainEntity>;
  }

  /**
   * Save the document attached to a domain object
   */
  static async save<TDomainEntity extends IdentifiableObject>(
    obj: WithDocument<TDomainEntity>
  ): Promise<WithDocument<TDomainEntity>> {
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
  static async populate<TDomainEntity extends IdentifiableObject>(
    obj: WithDocument<TDomainEntity>,
    path: string
  ): Promise<WithDocument<TDomainEntity>> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    await obj.document.populate(path);
    return obj;
  }

  /**
   * Remove the document from the database
   */
  static async remove<TDomainEntity extends IdentifiableObject>(
    obj: WithDocument<TDomainEntity>
  ): Promise<void> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    await obj.document.remove();
  }

  /**
   * Check if a domain object has a document attached
   */
  static hasDocument<TDomainEntity extends IdentifiableObject>(
    obj: WithDocument<TDomainEntity>
  ): boolean {
    return !!obj.document;
  }

  /**
   * Create a new domain object with document attached
   */
  static createWithDocument<
    TDomainEntity extends IdentifiableObject,
    Args extends any[],
  >(
    DomainClass: new (...args: Args) => TDomainEntity,
    document: MongooseDocument & Document,
    constructorArgs: Args
  ): WithDocument<TDomainEntity> {
    const domainObject = new DomainClass(...constructorArgs);
    return this.attachDocument(domainObject, document);
  }
}
