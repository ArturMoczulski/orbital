import { z } from "zod";

/**
 * Mapping of romantic attraction triggers to a 0.0–1.0 numeric value.
 * Keys represent stimuli or traits a character can be romantically attracted to.
 */
export type RomanticAttractionTriggers = Record<string, number>;

/**
 * Zod schema for romantic attraction triggers.
 */
export const RomanticAttractionTriggersSchema = z
  .record(z.string(), z.number())
  .describe(
    "Mapping of romantic attraction triggers to a 0.0–1.0 numeric value"
  );
