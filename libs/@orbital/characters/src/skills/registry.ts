import { SkillClass } from "./skill-type";
import { SkillName } from "../enums/skill-name.enum";
import { SkillCategory } from "../enums/skill-category.enum";

/**
 * Registry for all GURPS skill classes.
 * Populate when individual skill classes are implemented.
 */
export class SkillRegistry {
  private static skills: Map<SkillName, SkillClass> = new Map<
    SkillName,
    SkillClass
  >([
    // [SkillName.SWORD, SwordSkill],
  ]);

  /**
   * Get a skill class by its SkillName.
   */
  static getSkill(name: SkillName): SkillClass | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all registered skill classes.
   */
  static getAllSkills(): SkillClass[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by category.
   */
  static getSkillsByCategory(category: SkillCategory): SkillClass[] {
    return this.getAllSkills().filter((skill) => skill.category === category);
  }
}
