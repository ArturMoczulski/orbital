"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaRegistry = void 0;
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
exports.schemaRegistry = new Map();
