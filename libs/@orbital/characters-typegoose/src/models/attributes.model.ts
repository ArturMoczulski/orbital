import { prop } from "@typegoose/typegoose";

/**
 * Base Attributes interface to avoid circular dependency with @orbital/characters
 */
interface BaseAttributes {
  ST: number;
  DX: number;
  IQ: number;
  HT: number;
}

/**
 * TypeGoose model for embedded Attributes sub-document.
 */
export class AttributesModel implements BaseAttributes {
  @prop({ required: true })
  ST!: number;

  @prop({ required: true })
  DX!: number;

  @prop({ required: true })
  IQ!: number;

  @prop({ required: true })
  HT!: number;
}
