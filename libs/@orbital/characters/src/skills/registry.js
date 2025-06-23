"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillRegistry = void 0;
/**
 * Registry for all GURPS skill classes.
 * Populate when individual skill classes are implemented.
 */
class SkillRegistry {
    /**
     * Get a skill class by its SkillName.
     */
    static getSkill(name) {
        return this.skills.get(name);
    }
    /**
     * Get all registered skill classes.
     */
    static getAllSkills() {
        return Array.from(this.skills.values());
    }
    /**
     * Get skills by category.
     */
    static getSkillsByCategory(category) {
        return this.getAllSkills().filter((skill) => skill.category === category);
    }
}
exports.SkillRegistry = SkillRegistry;
SkillRegistry.skills = new Map([
// [SkillName.SWORD, SwordSkill],
]);
