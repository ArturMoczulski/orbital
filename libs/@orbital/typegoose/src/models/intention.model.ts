import { Intention } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded Intention sub-document.
 * Extends Intention from @orbital/characters to inherit methods.
 */
export class IntentionModel extends Intention {
  @prop({ required: true })
  override plan!: string;

  @prop({ required: true })
  override due!: Date;
}
