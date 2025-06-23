import { SkillName } from "../enums/skill-name.enum";

/**
 * Persistence type for a character’s skill.
 * Contains only minimal data: skill name and level.
 */
export class CharactersSkill {
  name!: SkillName;
  level!: number;
}
