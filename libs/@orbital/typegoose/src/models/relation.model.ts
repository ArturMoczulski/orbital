import { prop } from "@typegoose/typegoose";
import { Relation as BaseRelation } from "@orbital/characters";

/**
 * TypeGoose model for embedded Relation sub-document.
 */
export class RelationModel implements BaseRelation {
  @prop({ required: true })
  targetId!: string;

  @prop({ required: true })
  type!: string;

  @prop({ required: true })
  strength!: number;
}
