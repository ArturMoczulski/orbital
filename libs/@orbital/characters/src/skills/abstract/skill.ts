import { SkillName } from "../../enums/skill-name.enum";
import { SkillCategory } from "../../enums/skill-category.enum";
import { SkillDifficulty } from "../../enums/skill-difficulty.enum";

/**
 * Base class for GURPS skills.
 * Defines static properties and methods; individual skills extend this class.
 */
export abstract class Skill {
  static readonly skillName: SkillName;
  static readonly category: SkillCategory;
  static readonly difficulty: SkillDifficulty;
  static readonly modifiers?: number;
  static readonly defaultsTo?: SkillName[];
  static readonly specializations?: string[];

  /**
   * Calculate the effective skill roll given character attributes and a skill level.
   * Override in subclasses for skill-specific logic.
   */
  static calculateEffectiveSkill(
    characterAttributes: any,
    skillLevel: number
  ): number {
    return skillLevel;
  }

  /**
   * Calculate the point cost for a given skill level based on difficulty.
   * Override in subclasses for custom cost rules.
   */
  static calculatePointCost(skillLevel: number): number {
    return skillLevel;
  }

  /**
   * Get a human-readable description of the skill.
   * Override in subclasses to provide specific descriptions.
   */
  static getDescription(): string {
    return "Generic GURPS skill";
  }
}
