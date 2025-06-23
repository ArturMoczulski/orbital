import { prop } from "@typegoose/typegoose";
import {
  PsychologicalProfile as BasePsychologicalProfile,
  RomanticAttractionTriggers,
} from "@orbital/characters";

/**
 * Typegoose model for embedded PsychologicalProfile sub-document.
 */
export class PsychologicalProfileModel implements BasePsychologicalProfile {
  @prop({ required: true })
  normAdherence!: number;

  @prop({ required: true })
  altruism!: number;

  @prop({ required: true })
  selfCenteredness!: number;

  @prop({ required: true })
  ambition!: number;

  @prop({ required: true })
  happiness!: number;

  @prop({ required: true })
  selfDrive!: number;

  @prop({ required: true })
  authorityNeed!: number;

  @prop({ required: true })
  authorityObedience!: number;

  @prop({ required: true })
  entrepreneurialTendency!: number;

  @prop({ required: true })
  sociability!: number;

  @prop({ type: () => Object, _id: false })
  romanticAttractionTriggers?: RomanticAttractionTriggers;
}
