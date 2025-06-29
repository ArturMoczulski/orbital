import { IdentifiableObject } from "@orbital/core";
import { Document } from "mongoose";

/**
 * Type for a Mongoose document with common methods
 */
export interface MongooseDocument extends Document {
  save(): Promise<any>;
  populate(path: string): Promise<any>;
  remove(): Promise<any>;
}

/**
 * Extends domain objects with a document property
 *
 * @template TDomainEntity The domain class type (must extend IdentifiableObject)
 * @template TDocumentSchema The Mongoose schema type
 */
export type WithDocument<TDomainEntity extends IdentifiableObject> =
  TDomainEntity & {
    /**
     * The Mongoose document associated with this domain object
     */
    document?: MongooseDocument & Document;
  };
