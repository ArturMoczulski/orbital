import { SkillClass } from "./skill-type";

export function calculateEffectiveSkill(
  skill: SkillClass,
  characterAttributes: any,
  level: number
): number {
  return skill.calculateEffectiveSkill(characterAttributes, level);
}

export function calculatePointCost(skill: SkillClass, level: number): number {
  return skill.calculatePointCost(level);
}

export function getDescription(skill: SkillClass): string {
  return skill.getDescription();
}
