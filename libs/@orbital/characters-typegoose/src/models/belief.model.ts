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
 * Implements BeliefProps directly to avoid circular dependency with @orbital/core
 */
@modelOptions({
  schemaOptions: {
    _id: false,
  },
})
export class BeliefModel implements BeliefProps {
  @prop({ required: true })
  statement!: string;

  @prop({ required: true })
  certainty!: number;

  /**
   * Convert the model to a plain object
   */
  toPlainObject(): BeliefProps {
    return {
      statement: this.statement,
      certainty: this.certainty,
    };
  }
}
