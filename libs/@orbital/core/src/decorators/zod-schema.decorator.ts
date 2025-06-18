import { z } from "zod";

/**
 * Map to store Zod schemas associated with classes
 */
export const zodSchemaRegistry = new WeakMap<object, z.ZodType<any>>();

/**
 * Decorator that associates a Zod schema with a class
 *
 * @param schema The Zod schema to associate with the class
 * @returns A class decorator function
 *
 * @example
 * ```ts
 * @ZodSchema(PositionSchema)
 * export class Position extends BaseObject<Position> implements Position {
 *   // ...
 * }
 * ```
 */
export function ZodSchema<T>(schema: z.ZodType<T>) {
  return function (target: any) {
    // Store the schema in the registry
    zodSchemaRegistry.set(target, schema);
    return target;
  };
}
