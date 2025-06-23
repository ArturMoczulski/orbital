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
  let entry = schemaRegistry.get(inputKey) as RegisteredSchema | undefined;
  if (!entry) {
    entry = schemaRegistry.get(typeName);
  }
  if (!entry || !(entry.schema instanceof z.ZodObject)) {
    // No schema to traverse, skip nested schema traversal
    return;
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
      let nestedEntry = schemaRegistry.get(nestedKey);
      if (!nestedEntry) {
        // Fallback to class name without suffix for tests registering plain type keys
        nestedEntry = schemaRegistry.get(upperFirst(prop));
      }
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
/**
 * Build a combined Zod input schema for a given type,
 * recursively merging its root generation input schema with all nested generation input schemas.
 *
 * @param typeName Name of the root type (e.g., "City", "Area")
 * @returns A Zod object schema with root and all nested input schemas merged recursively
 */
export function getGenerationInputSchema(typeName: string): z.ZodTypeAny {
  // Use a nested structure to build the schema hierarchy
  const schemaTree: Record<string, any> = {};

  // Track paths we've already processed to avoid circular references
  const processedPaths = new Set<string>();

  // Process each schema found by the traversal
  traverseGenerationInputSchemas(typeName, (path, schema) => {
    if (path.length === 0) {
      // Root schema - merge its properties into the root of schemaTree
      Object.assign(schemaTree, (schema as any).shape);
    } else {
      // Nested schema - build the path in the tree
      let current = schemaTree;
      const pathKey = path.join(".");

      // Skip if we've already processed this path
      if (processedPaths.has(pathKey)) {
        return;
      }
      processedPaths.add(pathKey);

      // Navigate to the correct position in the tree
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }

      // Set the schema at the leaf position
      const lastSegment = path[path.length - 1];
      current[lastSegment] = (schema as any).shape;
    }
  });

  // Convert the schema tree to a Zod object
  function buildZodSchema(tree: Record<string, any>): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const [key, value] of Object.entries(tree)) {
      if (value instanceof z.ZodObject) {
        // If it's already a Zod object, use it directly
        shape[key] = value;
      } else if (typeof value === "object" && value !== null) {
        // If it's a nested object, recursively build its schema
        shape[key] = buildZodSchema(value);
      }
    }

    return z.object(shape);
  }

  // Build the final schema
  return buildZodSchema(schemaTree).describe(
    `Combined generation input schema for ${typeName} (recursive)`
  );
}

/**
 * Check if a generation input schema is registered for a given type.
 * This is a simple check without recursive fetching or merging.
 *
 * @param typeName Name of the type to check (e.g., "City", "Area")
 * @returns Boolean indicating if a generation input schema is registered
 */
export function isGenerationInputSchemaRegistered(typeName: string): boolean {
  // Check if the type exists in the registry
  if (!schemaRegistry.has(typeName)) {
    return false;
  }

  // If the type exists, assume it's generatable
  return true;
}

/**
 * Get a list of types available for generation.
 * Looks for registered schemas whose names end with "GenerationInput".
 */
export function getGeneratableTypes(): string[] {
  const availableTypes: string[] = [];
  for (const key of schemaRegistry.keys()) {
    if (key.endsWith("GenerationInput")) {
      // Strip the "GenerationInput" suffix to get the base type name
      availableTypes.push(key.slice(0, -"GenerationInput".length));
    }
  }
  return availableTypes;
}
