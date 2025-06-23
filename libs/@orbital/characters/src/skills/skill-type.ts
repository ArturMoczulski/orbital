import { Skill } from "./abstract/skill";

/**
 * Type representing the static side of a Skill class.
 * Allows passing the Skill class itself to utilities.
 */
export type SkillClass = typeof Skill;
