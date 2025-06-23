import { Creature } from "./creature";

/**
 * Concrete character type with name and title.
 */
export class Character extends Creature {
  /** Optional formal title (e.g., Sir, Lady) */
  title?: string;

  /** First, given name */
  firstName!: string;

  /** Last, family name */
  lastName!: string;
}
