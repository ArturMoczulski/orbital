import { IdentifiableObject } from "@orbital/core";
import { ReturnModelType } from "@typegoose/typegoose";
import { ZodObject } from "zod";
import { WithoutId } from "../types/utils";
import { DocumentRepository } from "./document-repository";

/**
 * Factory for creating document repositories
 */
export class DocumentRepositoryFactory {
  /**
   * Create a document repository for a domain class
   * @param model The Mongoose model
   * @param DomainClass The domain class constructor
   * @param schema Optional Zod schema for validation
   * @returns A new DocumentRepository instance
   */
  static create<
    TDomainEntity extends IdentifiableObject,
    TDocumentSchema extends Document = Document,
    TModelClass extends { new (...args: any[]): any } = {
      new (...args: any[]): any;
    },
  >(
    model: ReturnModelType<TModelClass>, // Mongoose Model from Typegoose
    DomainClass: new (data: any) => TDomainEntity,
    schema?: ZodObject<any>
  ): DocumentRepository<
    TDomainEntity,
    TDocumentSchema,
    WithoutId<TDomainEntity>,
    TModelClass
  > {
    return new DocumentRepository<
      TDomainEntity,
      TDocumentSchema,
      WithoutId<TDomainEntity>,
      TModelClass
    >(model, DomainClass, schema);
  }
}
