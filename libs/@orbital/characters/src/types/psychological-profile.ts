/**
 * GURPS psychological profile scales (0.0–1.0).
 */
import { RomanticAttractionTriggers } from "./attraction-triggers";

export class PsychologicalProfile {
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
   * Mapping of romantic attraction triggers to a 0.0–1.0 numeric value.
   */
  romanticAttractionTriggers?: RomanticAttractionTriggers;
}
