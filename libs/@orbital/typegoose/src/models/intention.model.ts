import { prop } from "@typegoose/typegoose";
import { Intention as BaseIntention } from "@orbital/characters";

/**
 * TypeGoose model for embedded Intention sub-document.
 */
export class IntentionModel implements BaseIntention {
  @prop({ required: true })
  plan!: string;

  @prop({ required: true })
  due!: Date;
}
