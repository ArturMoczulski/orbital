import { ZodSchema } from "@orbital/core";
import { z } from "zod";

/**
 * Type representing an intention formed by a creature.
 */
export type IntentionProps = z.infer<typeof IntentionSchema>;

/**
 * Zod schema for Intention.
 */
export const IntentionSchema = z
  .object({
    plan: z.string().describe("Plan description"),
    due: z.date().describe("Due date for the intention"),
  })
  .describe("An intention formed by a creature");

/**
 * Represents an intention formed by a creature.
 */
@ZodSchema(IntentionSchema)
export class Intention implements IntentionProps {
  /** Plan description */
  plan!: string;

  /** Due date for the intention */
  due!: Date;

  constructor(data: Partial<IntentionProps> = {}) {
    if (data.plan !== undefined) this.plan = data.plan;
    if (data.due !== undefined) this.due = data.due;
  }
}
