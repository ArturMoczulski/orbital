import { modelOptions } from "@typegoose/typegoose";

/**
 * Interface for romantic attraction triggers
 * Maps string keys to numeric values representing attraction levels.
 */
export interface RomanticAttractionTriggersProps {
  [key: string]: number;
}

/**
 * TypeGoose model for embedded RomanticAttractionTriggers sub-document.
 * Maps string keys to numeric values representing attraction levels.
 * Implements RomanticAttractionTriggersProps directly to avoid circular dependencies.
 */
@modelOptions({
  schemaOptions: {
    _id: false,
    // This allows for dynamic properties (string keys)
    strict: false,
  },
})
export class RomanticAttractionTriggersModel
  implements RomanticAttractionTriggersProps
{
  // TypeScript index signature to match RomanticAttractionTriggersProps type
  [key: string]: number | any;

  constructor(data: Record<string, number> = {}) {
    // Copy all properties from data to this instance
    Object.assign(this, data);
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   */
  toPlainObject(): Record<string, number> {
    const result: Record<string, number> = {};

    // Only copy numeric properties
    for (const key in this) {
      if (typeof this[key] === "number") {
        result[key] = this[key] as number;
      }
    }

    return result;
  }
}
