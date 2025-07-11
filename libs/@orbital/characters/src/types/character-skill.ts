import { ZodSchema } from "@orbital/core";
import { z } from "zod";
import { SkillName } from "../enums/skill-name.enum";

/**
 * Type representing a character's skill.
 */
export type CharactersSkillProps = z.infer<typeof CharactersSkillSchema>;

/**
 * Zod schema for a character's skill.
 */
export const CharactersSkillSchema = z
  .object({
    name: z.nativeEnum(SkillName).describe("Skill name"),
    level: z.number().describe("Skill level"),
  })
  .describe("Character's skill with name and level");

/**
 * Persistence type for a character's skill.
 * Contains only minimal data: skill name and level.
 */
@ZodSchema(CharactersSkillSchema)
export class CharactersSkill implements CharactersSkillProps {
  name!: SkillName;
  level!: number;

  constructor(data: Partial<CharactersSkillProps> = {}) {
    if (data.name !== undefined) this.name = data.name;
    if (data.level !== undefined) this.level = data.level;
  }
}
