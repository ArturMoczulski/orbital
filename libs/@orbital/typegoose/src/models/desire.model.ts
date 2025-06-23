import { prop } from "@typegoose/typegoose";
import { Desire as BaseDesire } from "@orbital/characters";

/**
 * TypeGoose model for embedded Desire sub-document.
 */
export class DesireModel implements BaseDesire {
  @prop({ required: true })
  goal!: string;

  @prop({ required: true })
  priority!: number;
}
