/**
 * Re-export of Mongoose types
 * This file previously exported WithDocument type which is now removed
 * as part of the Pure Repository Pattern implementation
 */

// Define a MongooseDocument interface to replace the one from with-document.ts
import { Document } from "mongoose";

export interface MongooseDocument extends Document {
  save(): Promise<any>;
  populate(path: string): Promise<any>;
  remove(): Promise<any>;
}
