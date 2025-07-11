import { Position } from "@orbital/core";
import { prop } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded Position sub-document.
 * Represents a 3D position with x, y, z coordinates.
 * Extends Position from @orbital/core to inherit methods like toPlainObject, convertValueToPlain, validateSchema
 */
export class PositionModel extends Position {
  @prop({ required: true })
  override x!: number;

  @prop({ required: true })
  override y!: number;

  @prop({ required: true })
  override z!: number;
}
