/**
 * Represents a relationship to another world object.
 */
export interface Relation {
  /** Target object identifier */
  targetId: string;
  /** Type of relationship */
  type: string;
  /** Strength of the relation */
  strength: number;
}
