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
  static attachDocument<T extends IdentifiableObject, S>(
    domainObject: T,
    document: MongooseDocument & S
  ): WithDocument<T, S> {
    (domainObject as WithDocument<T, S>).document = document;
    return domainObject as WithDocument<T, S>;
  }

  /**
   * Save the document attached to a domain object
   */
  static async save<T extends IdentifiableObject, S>(
    obj: WithDocument<T, S>
  ): Promise<WithDocument<T, S>> {
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
  static async populate<T extends IdentifiableObject, S>(
    obj: WithDocument<T, S>,
    path: string
  ): Promise<WithDocument<T, S>> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    await obj.document.populate(path);
    return obj;
  }

  /**
   * Remove the document from the database
   */
  static async remove<T extends IdentifiableObject, S>(
    obj: WithDocument<T, S>
  ): Promise<void> {
    if (!obj.document) {
      throw new Error("No document attached to this domain object");
    }

    await obj.document.remove();
  }

  /**
   * Check if a domain object has a document attached
   */
  static hasDocument<T extends IdentifiableObject, S>(
    obj: WithDocument<T, S>
  ): boolean {
    return !!obj.document;
  }

  /**
   * Create a new domain object with document attached
   */
  static createWithDocument<
    T extends IdentifiableObject,
    S,
    Args extends any[],
  >(
    DomainClass: new (...args: Args) => T,
    document: MongooseDocument & S,
    constructorArgs: Args
  ): WithDocument<T, S> {
    const domainObject = new DomainClass(...constructorArgs);
    return this.attachDocument(domainObject, document);
  }
}
