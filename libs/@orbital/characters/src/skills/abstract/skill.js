"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skill = void 0;
/**
 * Base class for GURPS skills.
 * Defines static properties and methods; individual skills extend this class.
 */
class Skill {
    /**
     * Calculate the effective skill roll given character attributes and a skill level.
     * Override in subclasses for skill-specific logic.
     */
    static calculateEffectiveSkill(characterAttributes, skillLevel) {
        return skillLevel;
    }
    /**
     * Calculate the point cost for a given skill level based on difficulty.
     * Override in subclasses for custom cost rules.
     */
    static calculatePointCost(skillLevel) {
        return skillLevel;
    }
    /**
     * Get a human-readable description of the skill.
     * Override in subclasses to provide specific descriptions.
     */
    static getDescription() {
        return "Generic GURPS skill";
    }
}
exports.Skill = Skill;
