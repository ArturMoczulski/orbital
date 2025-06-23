import type { Position } from "@orbital/core";

/**
 * Represents a memory stored by a creature.
 */
export interface Memory {
  /** Timestamp when memory was formed */
  timestamp: Date;
  /** Description of the memory */
  description: string;
  /** Emotional valence of the memory */
  valence: number;
  /** Optional location reference */
  locationId?: string;
  /** Optional coordinates of the memory */
  coordinates?: Position;
  /** Optional tags for categorization */
  tags?: string[];
}
