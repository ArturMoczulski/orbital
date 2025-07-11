import { ZodSchema } from "@orbital/core";
import { z } from "zod";

/**
 * Type representing GURPS core attributes.
 */
export type AttributesProps = z.infer<typeof AttributesSchema>;

/**
 * Zod schema for GURPS core attributes.
 */
export const AttributesSchema = z
  .object({
    ST: z.number().describe("Strength"),
    DX: z.number().describe("Dexterity"),
    IQ: z.number().describe("Intelligence Quotient"),
    HT: z.number().describe("Health"),
  })
  .describe("GURPS core attributes");

/**
 * GURPS core attributes.
 */
@ZodSchema(AttributesSchema)
export class Attributes implements AttributesProps {
  /**
   * Strength
   */
  ST!: number;
  /**
   * Dexterity
   */
  DX!: number;
  /**
   * Intelligence Quotient
   */
  IQ!: number;
  /**
   * Health
   */
  HT!: number;

  constructor(data: Partial<AttributesProps> = {}) {
    if (data.ST !== undefined) this.ST = data.ST;
    if (data.DX !== undefined) this.DX = data.DX;
    if (data.IQ !== undefined) this.IQ = data.IQ;
    if (data.HT !== undefined) this.HT = data.HT;
  }
}
