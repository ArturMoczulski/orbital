import { ZodSchema } from "@orbital/core";
import { z } from "zod";
import {
  RomanticAttractionTriggers,
  RomanticAttractionTriggersSchema,
} from "./attraction-triggers";

/**
 * Type representing GURPS psychological profile scales (0.0–1.0).
 */
export type PsychologicalProfileProps = z.infer<
  typeof PsychologicalProfileSchema
>;

/**
 * Zod schema for psychological profile scales.
 */
export const PsychologicalProfileSchema = z
  .object({
    normAdherence: z.number().describe("Norm adherence scale (0.0-1.0)"),
    altruism: z.number().describe("Altruism scale (0.0-1.0)"),
    selfCenteredness: z.number().describe("Self-centeredness scale (0.0-1.0)"),
    ambition: z.number().describe("Ambition scale (0.0-1.0)"),
    happiness: z.number().describe("Happiness scale (0.0-1.0)"),
    selfDrive: z.number().describe("Self-drive scale (0.0-1.0)"),
    authorityNeed: z.number().describe("Authority need scale (0.0-1.0)"),
    authorityObedience: z
      .number()
      .describe("Authority obedience scale (0.0-1.0)"),
    entrepreneurialTendency: z
      .number()
      .describe("Entrepreneurial tendency scale (0.0-1.0)"),
    sociability: z.number().describe("Sociability scale (0.0-1.0)"),
    romanticAttractionTriggers: z
      .union([RomanticAttractionTriggersSchema, z.array(z.string())])
      .optional()
      .describe(
        "Romantic attraction triggers as either a mapping to numeric values or an array of strings"
      ),
  })
  .describe("GURPS psychological profile scales (0.0–1.0)");

/**
 * GURPS psychological profile scales (0.0–1.0).
 */
@ZodSchema(PsychologicalProfileSchema)
export class PsychologicalProfile implements PsychologicalProfileProps {
  normAdherence!: number;
  altruism!: number;
  selfCenteredness!: number;
  ambition!: number;
  happiness!: number;
  selfDrive!: number;
  authorityNeed!: number;
  authorityObedience!: number;
  entrepreneurialTendency!: number;
  sociability!: number;

  /**
   * Romantic attraction triggers as either a mapping to numeric values or an array of strings.
   */
  romanticAttractionTriggers?: RomanticAttractionTriggers | string[];

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
    if (data.romanticAttractionTriggers !== undefined)
      this.romanticAttractionTriggers = data.romanticAttractionTriggers;
  }
}
