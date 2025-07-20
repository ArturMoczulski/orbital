import { ZodSchema } from "@orbital/core";
import { z } from "zod";
import { Creature, CreatureProps, CreatureSchema } from "./creature";

/**
 * Type representing a character in the world.
 */
// Define the schema first
export const CharacterSchema = CreatureSchema.extend({
  title: z
    .string()
    .optional()
    .describe("Optional formal title (e.g., Sir, Lady)"),
  firstName: z.string().optional().describe("First, given name"),
  lastName: z.string().optional().describe("Last, family name"),
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

// Then infer the type from the schema
export type CharacterProps = z.infer<typeof CharacterSchema>;

/**
 * Zod schema for Character.
 */
// Schema is now defined above, before the type

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

  constructor(data: Partial<CharacterProps> = {}) {
    super(data); // Pass data up the chain

    if (data.title !== undefined) this.title = data.title;
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
  }
}
