import { ZodSchema } from "@orbital/core";
import { z } from "zod";

/**
 * Type representing a relationship to another world object.
 */
export type RelationProps = z.infer<typeof RelationSchema>;

/**
 * Zod schema for Relation.
 */
export const RelationSchema = z
  .object({
    targetId: z.string().describe("Target object identifier"),
    type: z.string().describe("Type of relationship"),
    strength: z.number().describe("Strength of the relation"),
  })
  .describe("A relationship to another world object");

/**
 * Represents a relationship to another world object.
 */
@ZodSchema(RelationSchema)
export class Relation implements RelationProps {
  /** Target object identifier */
  targetId!: string;

  /** Type of relationship */
  type!: string;

  /** Strength of the relation */
  strength!: number;

  constructor(data: Partial<RelationProps> = {}) {
    if (data.targetId !== undefined) this.targetId = data.targetId;
    if (data.type !== undefined) this.type = data.type;
    if (data.strength !== undefined) this.strength = data.strength;
  }
}
