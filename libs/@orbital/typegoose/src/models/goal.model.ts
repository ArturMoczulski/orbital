import { Goal } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded Goal sub-document.
 * Extends Goal from @orbital/characters to inherit methods.
 */
export class GoalModel extends Goal {
  @prop({ required: true })
  override purpose!: string;

  @prop({ required: true })
  override timeRange!: string;

  @prop({ type: () => [String] })
  override resources?: string[];

  @prop({ type: () => [String] })
  override collaborators?: string[];

  @prop({ type: () => [String] })
  override plan?: string[];
}
