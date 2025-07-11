import { Position, PositionSchema, ZodSchema } from "@orbital/core";
import { z } from "zod";

/**
 * Type representing a memory stored by a creature.
 */
export type MemoryProps = z.infer<typeof MemorySchema>;

/**
 * Zod schema for Memory.
 */
export const MemorySchema = z
  .object({
    timestamp: z.date().describe("Timestamp when memory was formed"),
    description: z.string().describe("Description of the memory"),
    valence: z.number().describe("Emotional valence of the memory"),
    locationId: z.string().optional().describe("Optional location reference"),
    coordinates: PositionSchema.optional().describe(
      "Optional coordinates of the memory"
    ),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags for categorization"),
  })
  .describe("A memory stored by a creature");

/**
 * Represents a memory stored by a creature.
 */
@ZodSchema(MemorySchema)
export class Memory implements MemoryProps {
  /** Timestamp when memory was formed */
  timestamp!: Date;

  /** Description of the memory */
  description!: string;

  /** Emotional valence of the memory */
  valence!: number;

  /** Optional location reference */
  locationId?: string;

  /** Optional coordinates of the memory */
  coordinates?: Position;

  /** Optional tags for categorization */
  tags?: string[];

  constructor(data: Partial<MemoryProps> = {}) {
    if (data.timestamp !== undefined) this.timestamp = data.timestamp;
    if (data.description !== undefined) this.description = data.description;
    if (data.valence !== undefined) this.valence = data.valence;
    if (data.locationId !== undefined) this.locationId = data.locationId;
    if (data.coordinates !== undefined)
      this.coordinates = new Position(data.coordinates);
    if (data.tags !== undefined) this.tags = data.tags;
  }
}
