"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseObject = void 0;
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
/**
 * BaseObject provides automatic assignment of partial data into instance properties.
 */
class BaseObject {
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
        // Validation can be performed by calling validate() when needed
    }
    /**
     * Validates the current instance against the class's Zod schema.
     * This method uses the static zSchema() method to get the schema.
     *
     * @throws ZodError if validation fails
     * @returns this instance if validation succeeds
     */
    validate() {
        try {
            const constructor = this.constructor;
            const schema = constructor.zSchema();
            // Parse the current instance data
            schema.parse(this);
            return this;
        }
        catch (error) {
            if (error instanceof Error &&
                error.message.includes("No Zod schema registered")) {
                // If there's no schema registered, we'll skip validation
                return this;
            }
            // Wrap validation errors with more context
            throw new Error(`Validation failed in ${this.constructor.name}: ${error}`);
        }
    }
    /**
     * Returns the Zod schema associated with this class.
     * This method looks up the schema in the zodSchemaRegistry.
     *
     * @returns The Zod schema for this class
     * @throws Error if no schema is registered for this class
     */
    /**
     * Returns the Zod schema associated with this class.
     * This method looks up the schema in the zodSchemaRegistry.
     * If no schema is found for this class, it walks up the prototype chain
     * to find a schema from a parent class.
     *
     * @returns The Zod schema for this class
     * @throws Error if no schema is registered for this class or any of its ancestors
     */
    static zSchema() {
        // Start with the current class
        let currentConstructor = this;
        let schema;
        // Walk up the prototype chain until we find a schema or reach Object
        while (currentConstructor && currentConstructor !== Object) {
            schema = zod_schema_decorator_1.zodSchemaRegistry.get(currentConstructor);
            if (schema) {
                return schema;
            }
            // Move up to the parent class
            currentConstructor = Object.getPrototypeOf(currentConstructor);
        }
        // If we get here, no schema was found
        throw new Error(`No Zod schema registered for class ${this.name} or any of its parent classes. Use the @ZodSchema decorator to register a schema.`);
    }
    /**
     * Returns the JSON Schema representation of this class's Zod schema.
     * This is useful for generating documentation or for LLM prompts.
     *
     * @returns The JSON Schema for this class
     */
    static toJsonSchema() {
        // This requires zod-to-json-schema package to be installed
        // For now, we'll just return a simple object with the schema's description
        const schema = this.zSchema();
        return {
            type: "object",
            description: schema.description || `Schema for ${this.name}`,
            properties: {},
        };
    }
}
exports.BaseObject = BaseObject;
