import { z } from "zod";
import { schemaRegistry } from "../registry";

/**
 * Legacy registry for Zod schemas that uses WeakMap for reference-based lookups.
 *
 * This registry is maintained for backwards compatibility with existing code.
 * New code should prefer using the `schemaRegistry` which provides name-based lookups.
 *
 * @deprecated Use `schemaRegistry` for new code
 */
export const zodSchemaRegistry = new WeakMap<object, z.ZodType<any>>();

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
export function ZodSchema<T>(schema: z.ZodType<T>): ClassDecorator {
  return function (target: any) {
    // Store in backwards-compatibility registry
    zodSchemaRegistry.set(target, schema);

    // Register into central schemaRegistry under class name
    // This enables lookup by name without relying on globalThis
    schemaRegistry.set(target.name, { ctor: target, schema });

    return target;
  };
}
