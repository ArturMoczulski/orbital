import { ZodSchema } from "@orbital/core";
import { z } from "zod";
import { Creature, CreatureProps, CreatureSchema } from "./creature";

/**
 * Type representing a character in the world.
 */
export interface CharacterProps extends CreatureProps {
  title?: string;
  firstName: string;
  lastName: string;
  history?: {
    event: string;
    date?: string;
    location?: string;
    significance?: number;
  }[];
}

/**
 * Zod schema for Character.
 */
export const CharacterSchema = CreatureSchema.extend({
  title: z
    .string()
    .optional()
    .describe("Optional formal title (e.g., Sir, Lady)"),
  firstName: z.string().describe("First, given name"),
  lastName: z.string().describe("Last, family name"),
  history: z
    .array(
      z.object({
        event: z.string(),
        date: z.string().optional(),
        location: z.string().optional(),
        significance: z.number().optional(),
      })
    )
    .optional()
    .describe("Character's historical events"),
}).describe("A character in the world with name and title");

/**
 * Concrete character type with name and title.
 */
@ZodSchema(CharacterSchema)
export class Character
  extends Creature
  implements CharacterProps, CreatureProps
{
  /** Optional formal title (e.g., Sir, Lady) */
  title?: string;

  /** First, given name */
  firstName!: string;

  /** Last, family name */
  lastName!: string;

  /** Character's historical events */
  history?: {
    event: string;
    date?: string;
    location?: string;
    significance?: number;
  }[];

  constructor(data: Partial<CharacterProps> = {}) {
    super(data); // Pass data up the chain

    if (data.title !== undefined) this.title = data.title;
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.history !== undefined) this.history = data.history;
  }
}
