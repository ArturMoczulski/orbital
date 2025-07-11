import { RomanticAttractionTriggers } from "@orbital/characters";
import { modelOptions } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded RomanticAttractionTriggers sub-document.
 * Maps string keys to numeric values representing attraction levels.
 * Implements RomanticAttractionTriggers from @orbital/characters.
 */
@modelOptions({
  schemaOptions: {
    _id: false,
    // This allows for dynamic properties (string keys)
    strict: false,
  },
})
export class RomanticAttractionTriggersModel
  implements RomanticAttractionTriggers
{
  // TypeScript index signature to match RomanticAttractionTriggers type
  [key: string]: number;
}
