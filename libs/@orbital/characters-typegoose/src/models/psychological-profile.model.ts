import { prop } from "@typegoose/typegoose";
import { RomanticAttractionTriggersModel } from "./romantic-attraction-triggers.model";

/**
 * Interface for psychological profile properties
 */
export interface PsychologicalProfileProps {
  normAdherence: number;
  altruism: number;
  selfCenteredness: number;
  ambition: number;
  happiness: number;
  selfDrive: number;
  authorityNeed: number;
  authorityObedience: number;
  entrepreneurialTendency: number;
  sociability: number;
  romanticAttractionTriggers?: RomanticAttractionTriggersModel;
}

/**
 * TypeGoose model for embedded PsychologicalProfile sub-document.
 * Implements PsychologicalProfileProps directly to avoid circular dependencies.
 */
export class PsychologicalProfileModel implements PsychologicalProfileProps {
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

  @prop({ type: () => RomanticAttractionTriggersModel, _id: false })
  romanticAttractionTriggers?: RomanticAttractionTriggersModel;

  constructor(data: Partial<PsychologicalProfileProps> = {}) {
    if (data.normAdherence !== undefined)
      this.normAdherence = data.normAdherence;
    if (data.altruism !== undefined) this.altruism = data.altruism;
    if (data.selfCenteredness !== undefined)
      this.selfCenteredness = data.selfCenteredness;
    if (data.ambition !== undefined) this.ambition = data.ambition;
    if (data.happiness !== undefined) this.happiness = data.happiness;
    if (data.selfDrive !== undefined) this.selfDrive = data.selfDrive;
    if (data.authorityNeed !== undefined)
      this.authorityNeed = data.authorityNeed;
    if (data.authorityObedience !== undefined)
      this.authorityObedience = data.authorityObedience;
    if (data.entrepreneurialTendency !== undefined)
      this.entrepreneurialTendency = data.entrepreneurialTendency;
    if (data.sociability !== undefined) this.sociability = data.sociability;
    if (data.romanticAttractionTriggers !== undefined) {
      this.romanticAttractionTriggers =
        data.romanticAttractionTriggers instanceof
        RomanticAttractionTriggersModel
          ? data.romanticAttractionTriggers
          : new RomanticAttractionTriggersModel(
              data.romanticAttractionTriggers as Record<string, number>
            );
    }
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      normAdherence: this.normAdherence,
      altruism: this.altruism,
      selfCenteredness: this.selfCenteredness,
      ambition: this.ambition,
      happiness: this.happiness,
      selfDrive: this.selfDrive,
      authorityNeed: this.authorityNeed,
      authorityObedience: this.authorityObedience,
      entrepreneurialTendency: this.entrepreneurialTendency,
      sociability: this.sociability,
      romanticAttractionTriggers:
        this.romanticAttractionTriggers?.toPlainObject(),
    };
  }
}
