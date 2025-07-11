import { BaseObject } from "@orbital/core";
import { modelOptions, prop } from "@typegoose/typegoose";

/**
 * Interface for Belief properties
 */
export interface BeliefProps {
  statement: string;
  certainty: number;
}

/**
 * TypeGoose model for embedded Belief sub-document.
 * Extends BaseObject from @orbital/core to inherit methods like toPlainObject, convertValueToPlain, validateSchema
 */
@modelOptions({
  schemaOptions: {
    _id: false,
  },
})
export class BeliefModel
  extends BaseObject<BeliefProps>
  implements BeliefProps
{
  @prop({ required: true })
  statement!: string;

  @prop({ required: true })
  certainty!: number;
}
