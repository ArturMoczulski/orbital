import { PsychologicalProfile } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";
import { RomanticAttractionTriggersModel } from "./romantic-attraction-triggers.model";

/**
 * Typegoose model for embedded PsychologicalProfile sub-document.
 * Extends PsychologicalProfile from @orbital/characters to inherit methods.
 */
export class PsychologicalProfileModel extends PsychologicalProfile {
  @prop({ required: true })
  override normAdherence!: number;

  @prop({ required: true })
  override altruism!: number;

  @prop({ required: true })
  override selfCenteredness!: number;

  @prop({ required: true })
  override ambition!: number;

  @prop({ required: true })
  override happiness!: number;

  @prop({ required: true })
  override selfDrive!: number;

  @prop({ required: true })
  override authorityNeed!: number;

  @prop({ required: true })
  override authorityObedience!: number;

  @prop({ required: true })
  override entrepreneurialTendency!: number;

  @prop({ required: true })
  override sociability!: number;

  @prop({ type: () => RomanticAttractionTriggersModel, _id: false })
  override romanticAttractionTriggers?: RomanticAttractionTriggersModel;
}
