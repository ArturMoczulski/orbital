"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodSchemaRegistry = void 0;
exports.ZodSchema = ZodSchema;
const registry_1 = require("../registry");
/**
 * Legacy registry for Zod schemas that uses WeakMap for reference-based lookups.
 *
 * This registry is maintained for backwards compatibility with existing code.
 * New code should prefer using the `schemaRegistry` which provides name-based lookups.
 *
 * @deprecated Use `schemaRegistry` for new code
 */
exports.zodSchemaRegistry = new WeakMap();
/**
 * Decorator that associates a Zod schema with a class.
 *
 * This decorator performs two registrations:
 * 1. Registers the schema in the legacy `zodSchemaRegistry` using the class constructor as the key
 * 2. Registers both the class constructor and schema in the new `schemaRegistry` using the class name as the key
 *
 * The second registration enables lookup by class name, which is used by the
 * `CompositeObjectGenerationRunnable` to find nested object types without relying on the global scope.
 *
 * @param schema The Zod schema to associate with the class
 * @returns A class decorator function
 *
 * @example
 * ```ts
 * // Define a schema for your class
 * const CitySchema = z.object({
 *   name: z.string(),
 *   population: z.number(),
 *   isCapital: z.boolean()
 * });
 *
 * // Define an input schema for generation
 * const CityInputSchema = z.object({
 *   name: z.string().optional(),
 *   minPopulation: z.number().optional()
 * });
 *
 * // Apply the decorator to your class
 * @ZodSchema(CityInputSchema)
 * export class CityGenerator {
 *   // Implementation...
 * }
 * ```
 *
 * The class can then be discovered by the `CompositeObjectGenerationRunnable`
 * when generating nested objects, without relying on the global scope.
 */
function ZodSchema(schema) {
    return function (target) {
        // Store in backwards-compatibility registry
        exports.zodSchemaRegistry.set(target, schema);
        // Register into central schemaRegistry under class name
        // This enables lookup by name without relying on globalThis
        registry_1.schemaRegistry.set(target.name, { ctor: target, schema });
        return target;
    };
}
