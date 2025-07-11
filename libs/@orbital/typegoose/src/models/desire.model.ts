import { Desire } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded Desire sub-document.
 * Extends Desire from @orbital/characters to inherit methods.
 */
export class DesireModel extends Desire {
  @prop({ required: true })
  override goal!: string;

  @prop({ required: true })
  override priority!: number;
}
