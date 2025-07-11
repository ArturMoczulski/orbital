import { Relation } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded Relation sub-document.
 * Extends Relation from @orbital/characters to inherit methods.
 */
export class RelationModel extends Relation {
  @prop({ required: true })
  override targetId!: string;

  @prop({ required: true })
  override type!: string;

  @prop({ required: true })
  override strength!: number;
}
