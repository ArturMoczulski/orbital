import { IdentifiableObject } from "@orbital/core";
import { DocumentRepository } from "./document-repository";

/**
 * Factory for creating document repositories
 */
export class DocumentRepositoryFactory {
  /**
   * Create a document repository for a domain class
   * @param model The Mongoose model
   * @param DomainClass The domain class constructor
   * @returns A new DocumentRepository instance
   */
  static create<T extends IdentifiableObject, S = any>(
    // TODO: Replace 'any' with proper Mongoose Model type when type issues are resolved
    model: any, // Mongoose Model
    DomainClass: new (data: any) => T
  ): DocumentRepository<T, S> {
    return new DocumentRepository<T, S>(model, DomainClass);
  }
}
