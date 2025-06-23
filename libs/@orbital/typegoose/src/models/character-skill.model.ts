import { prop } from "@typegoose/typegoose";
import { CharactersSkill as BaseCharactersSkill } from "@orbital/characters";
import { SkillName } from "@orbital/characters";

/**
 * TypeGoose model for embedded CharactersSkill sub-document.
 */
export class CharactersSkillModel implements BaseCharactersSkill {
  @prop({ enum: SkillName, required: true })
  name!: SkillName;

  @prop({ required: true })
  level!: number;
}
