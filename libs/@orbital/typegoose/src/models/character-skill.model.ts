import { CharactersSkill, SkillName } from "@orbital/characters";
import { prop } from "@typegoose/typegoose";

/**
 * TypeGoose model for embedded CharactersSkill sub-document.
 * Extends CharactersSkill from @orbital/characters to inherit methods.
 */
export class CharactersSkillModel extends CharactersSkill {
  @prop({ enum: SkillName, required: true })
  override name!: SkillName;

  @prop({ required: true })
  override level!: number;
}
