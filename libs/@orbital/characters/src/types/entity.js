"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
/**
 * Base entity with a unique identifier.
 */
class Entity {
    /**
     * Returns a JSON-stringified representation of this entity.
     */
    toString() {
        return JSON.stringify(this);
    }
}
exports.Entity = Entity;
