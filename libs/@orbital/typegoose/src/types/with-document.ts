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
 * @template T The domain class type (must extend BaseObject)
 * @template S The Mongoose schema type
 */
export type WithDocument<T extends IdentifiableObject, S = any> = T & {
  /**
   * The Mongoose document associated with this domain object
   */
  document?: MongooseDocument & S;
};
