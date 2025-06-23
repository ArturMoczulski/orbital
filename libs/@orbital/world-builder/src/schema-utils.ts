import { z } from "zod";
import upperFirst from "lodash/upperFirst";
import { RegisteredSchema, schemaRegistry } from "@orbital/core";

/**
 * Traverse generation input schemas for a given type and its nested properties.
 *
 * @param typeName Name of the root type (e.g., "City", "Area")
 * @param callback Called with the property path segments and the corresponding Zod object schema
 */
export function traverseGenerationInputSchemas(
  typeName: string,
  callback: (path: string[], schema: z.ZodObject<any>) => void
): void {
  const inputKey = `${typeName}GenerationInput`;
  const entry: RegisteredSchema | undefined = schemaRegistry.get(inputKey);
  if (!entry) {
    throw new Error(`No input schema registered for "${inputKey}".`);
  }
  const rootSchema = entry.schema;
  if (!(rootSchema instanceof z.ZodObject)) {
    return;
  }

  function recurse(schema: z.ZodObject<any>, path: string[]) {
    callback(path, schema);
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    for (const prop of Object.keys(shape)) {
      const nestedKey = `${upperFirst(prop)}GenerationInput`;
      const nestedEntry = schemaRegistry.get(nestedKey);
      if (nestedEntry && nestedEntry.schema instanceof z.ZodObject) {
        recurse(nestedEntry.schema, [...path, prop]);
      }
    }
  }

  recurse(rootSchema, []);
}

/**
 * Build a combined Zod input schema for a given type,
 * merging its root generation input schema with any nested generation input schemas.
 *
 * @param typeName Name of the root type (e.g., "City", "Area")
 * @returns A Zod object schema with root and nested input schemas merged
 */
export function getGenerationInputSchema(typeName: string): z.ZodTypeAny {
  let mergedShape: Record<string, z.ZodTypeAny> = {};
  traverseGenerationInputSchemas(typeName, (path, schema) => {
    if (path.length === 0) {
      Object.assign(mergedShape, schema.shape);
    } else if (path.length === 1) {
      mergedShape[path[0]] = schema;
    }
    // deeper nested schemas are not merged in this helper
  });
  return z
    .object(mergedShape)
    .describe(`Combined generation input schema for ${typeName}`);
}
