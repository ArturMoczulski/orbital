/**
 * Represents a goal that a creature is pursuing.
 */
export interface Goal {
  /** Purpose or objective of the goal */
  purpose: string;
  /** Time range during which the goal is active */
  timeRange: string;
  /** Optional required resources */
  resources?: string[];
  /** Optional collaborators involved */
  collaborators?: string[];
  /** Optional plan steps */
  plan?: string[];
}
