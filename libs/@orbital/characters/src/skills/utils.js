"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEffectiveSkill = calculateEffectiveSkill;
exports.calculatePointCost = calculatePointCost;
exports.getDescription = getDescription;
function calculateEffectiveSkill(skill, characterAttributes, level) {
    return skill.calculateEffectiveSkill(characterAttributes, level);
}
function calculatePointCost(skill, level) {
    return skill.calculatePointCost(level);
}
function getDescription(skill) {
    return skill.getDescription();
}
