import { ZodSchema } from "@orbital/core";
import { z } from "zod";

/**
 * Type representing a desire motivating the creature.
 */
export type DesireProps = z.infer<typeof DesireSchema>;

/**
 * Zod schema for Desire.
 */
export const DesireSchema = z
  .object({
    goal: z.string().describe("Goal description"),
    priority: z.number().describe("Priority level of the desire"),
  })
  .describe("A desire motivating the creature");

/**
 * Represents a desire motivating the creature.
 */
@ZodSchema(DesireSchema)
export class Desire implements DesireProps {
  /** Goal description */
  goal!: string;

  /** Priority level of the desire */
  priority!: number;

  constructor(data: Partial<DesireProps> = {}) {
    if (data.goal !== undefined) this.goal = data.goal;
    if (data.priority !== undefined) this.priority = data.priority;
  }
}
