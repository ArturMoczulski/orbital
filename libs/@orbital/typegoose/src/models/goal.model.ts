import { prop } from "@typegoose/typegoose";
import { Goal as BaseGoal } from "@orbital/characters";

/**
 * TypeGoose model for embedded Goal sub-document.
 */
export class GoalModel implements BaseGoal {
  @prop({ required: true })
  purpose!: string;

  @prop({ required: true })
  timeRange!: string;

  @prop({ type: () => [String] })
  resources?: string[];

  @prop({ type: () => [String] })
  collaborators?: string[];

  @prop({ type: () => [String] })
  plan?: string[];
}
