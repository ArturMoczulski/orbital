import { z } from "zod";

/**
 * Represents a registered schema entry in the central registry.
 * Contains both the class constructor and its associated Zod schema.
 */
export interface RegisteredSchema {
  /** The class constructor */
  ctor: new (...args: any[]) => any;
  /** The Zod schema associated with this class */
  schema: z.ZodType<any>;
}

/**
 * Central registry for type information used throughout the Orbital framework.
 *
 * This registry maps class names to their constructors and associated Zod schemas,
 * enabling type-safe object generation and validation without relying on global scope.
 *
 * Classes should register themselves using the `@ZodSchema` decorator, which will
 * automatically add them to this registry.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { ZodSchema } from "@orbital/core";
 *
 * const CityInputSchema = z.object({
 *   name: z.string(),
 *   population: z.number()
 * });
 *
 * @ZodSchema(CityInputSchema)
 * export class CityGenerator {
 *   // Class implementation...
 * }
 * ```
 *
 * The class can then be looked up in the registry by name:
 * ```typescript
 * const entry = schemaRegistry.get("CityGenerator");
 * if (entry) {
 *   const { ctor: Constructor, schema } = entry;
 *   const instance = new Constructor();
 *   // Use the schema for validation...
 * }
 * ```
 */
export const schemaRegistry = new Map<string, RegisteredSchema>();
