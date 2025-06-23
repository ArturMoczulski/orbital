"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldHistory = void 0;
/**
 * Registry for all historical events in the world.
 */
class WorldHistory {
    constructor() {
        /** Collection of recorded history events */
        this.events = [];
    }
    /**
     * Record a new history event.
     * @param event The event to add to history
     */
    record(event) {
        this.events.push(event);
    }
    /**
     * Retrieve all recorded events.
     */
    getAll() {
        return this.events;
    }
    /**
     * Returns a stringified version of this instance.
     */
    toString() {
        return JSON.stringify(this);
    }
}
exports.WorldHistory = WorldHistory;
