import { ZodSchema } from "@orbital/core";
import { z } from "zod";

/**
 * Type representing a goal that a creature is pursuing.
 */
export type GoalProps = z.infer<typeof GoalSchema>;

/**
 * Zod schema for Goal.
 */
export const GoalSchema = z
  .object({
    purpose: z.string().describe("Purpose or objective of the goal"),
    timeRange: z
      .string()
      .describe("Time range during which the goal is active"),
    resources: z
      .array(z.string())
      .optional()
      .describe("Optional required resources"),
    collaborators: z
      .array(z.string())
      .optional()
      .describe("Optional collaborators involved"),
    plan: z.array(z.string()).optional().describe("Optional plan steps"),
  })
  .describe("A goal that a creature is pursuing");

/**
 * Represents a goal that a creature is pursuing.
 */
@ZodSchema(GoalSchema)
export class Goal implements GoalProps {
  /** Purpose or objective of the goal */
  purpose!: string;

  /** Time range during which the goal is active */
  timeRange!: string;

  /** Optional required resources */
  resources?: string[];

  /** Optional collaborators involved */
  collaborators?: string[];

  /** Optional plan steps */
  plan?: string[];

  constructor(data: Partial<GoalProps> = {}) {
    if (data.purpose !== undefined) this.purpose = data.purpose;
    if (data.timeRange !== undefined) this.timeRange = data.timeRange;
    if (data.resources !== undefined) this.resources = data.resources;
    if (data.collaborators !== undefined)
      this.collaborators = data.collaborators;
    if (data.plan !== undefined) this.plan = data.plan;
  }
}
