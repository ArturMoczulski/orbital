import { Memory } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";
import { PositionModel } from "./position.model";

/**
 * TypeGoose model for embedded Memory sub-document.
 * Extends Memory from @orbital/characters to inherit methods.
 */
export class MemoryModel extends Memory {
  @prop({ required: true })
  override timestamp!: Date;

  @prop({ required: true })
  override description!: string;

  @prop({ required: true })
  override valence!: number;

  @prop()
  override locationId?: string;

  @prop({ type: () => PositionModel, _id: false })
  override coordinates?: PositionModel;

  @prop({ type: () => [String] })
  override tags?: string[];
}
