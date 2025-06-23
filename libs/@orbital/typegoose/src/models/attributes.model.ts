import { prop } from "@typegoose/typegoose";
import { Attributes as BaseAttributes } from "@orbital/characters";

/**
 * TypeGoose model for embedded Attributes sub-document.
 */
export class AttributesModel extends BaseAttributes {
  @prop({ required: true })
  ST!: number;

  @prop({ required: true })
  DX!: number;

  @prop({ required: true })
  IQ!: number;

  @prop({ required: true })
  HT!: number;
}
