import { z } from "zod";
import { getReference, hasReference } from "./reference";

/**
 * Options for parsing with references
 */
export interface ParseWithReferencesOptions {
  /**
   * Dependencies to validate references against
   * The keys should match the reference names, and the values should be arrays of objects
   */
  dependencies?: Record<string, any[]>;

  /**
   * Current path for nested validation
   * @internal
   */
  path?: (string | number)[];

  /**
   * Maximum depth for recursive validation
   * Default: 1 - Only validate immediate relationships
   */
  maxDepth?: number;

  /**
   * Visited schema-data pairs to detect circular references
   * @internal
   */
  visitedPaths?: Set<string>;
}

/**
 * Parse data with a schema, validating references against dependencies
 *
 * @param schema The schema to validate against
 * @param data The data to validate
 * @param options Options for validation
 * @returns The validation result
 */
export function parseWithReferences<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ParseWithReferencesOptions = {}
): { success: boolean; data?: T; error?: z.ZodError } {
  // First do standard Zod validation
  const result = schema.safeParse(data);
  if (!result.success) {
    return result;
  }

  // Then validate references if dependencies are provided
  if (options.dependencies) {
    // Initialize visitedPaths if not provided
    if (!options.visitedPaths) {
      options.visitedPaths = new Set<string>();
    }

    // Set default maxDepth if not provided
    if (options.maxDepth === undefined) {
      options.maxDepth = 1; // Default to only validating immediate relationships
    }

    const referenceErrors = validateReferences(schema, data, options);

    if (referenceErrors.length > 0) {
      // Create a ZodError with the reference validation issues
      const error = new z.ZodError(referenceErrors);
      return { success: false, error };
    }
  }

  // If we got here, validation passed
  return { success: true, data: result.data as T };
}

/**
 * Validate references in a schema against dependencies
 *
 * @param schema The schema to validate
 * @param data The data to validate
 * @param options Options for validation
 * @param currentPath Current path for nested validation
 * @returns Array of ZodIssues for any reference validation errors
 */
export function validateReferences(
  schema: z.ZodType<any>,
  data: any,
  options: ParseWithReferencesOptions,
  currentPath: (string | number)[] = []
): z.ZodIssue[] {
  const issues: z.ZodIssue[] = [];
  const pathStr = currentPath.length > 0 ? currentPath.join(".") : "root";

  // Check for maximum recursion depth
  if (options.maxDepth !== undefined && currentPath.length > options.maxDepth) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: currentPath,
      message: `Maximum recursion depth exceeded at ${pathStr}`,
    });
    return issues;
  }

  // Create a unique key for this schema-data pair
  // We use schema constructor name, path, and data type/id for identification
  const schemaId = schema._def.description || schema.constructor.name;
  const dataId =
    typeof data === "object" && data !== null && data._id
      ? data._id
      : typeof data === "string"
        ? data
        : JSON.stringify(data).substring(0, 50); // Use a substring of JSON for complex objects
  const visitKey = `${schemaId}:${pathStr}:${dataId}`;

  // Check if we've already visited this schema-data pair
  if (options.visitedPaths?.has(visitKey)) {
    // We don't add an issue for circular references - we just stop recursion
    // This allows circular references to exist without validation errors
    return issues;
  }

  // Add this schema-data pair to visited paths
  options.visitedPaths?.add(visitKey);

  // Handle object schemas
  if (schema instanceof z.ZodObject) {
    Object.entries(schema.shape).forEach(([key, fieldSchema]) => {
      const fieldPath = [...currentPath, key];
      const fieldValue = data?.[key];

      // Recursively validate nested fields
      if (fieldValue !== undefined) {
        // Cast to ZodTypeAny to ensure type safety
        const zodFieldSchema = fieldSchema as z.ZodTypeAny;

        const fieldIssues = validateReferences(
          zodFieldSchema,
          fieldValue,
          options,
          fieldPath
        );

        issues.push(...fieldIssues);
      }
    });

    // Remove this path from visited paths when we're done with this object
    // This allows the same schema to be reused in different parts of the object graph
    options.visitedPaths?.delete(visitKey);
  }
  // Handle array schemas
  else if (schema instanceof z.ZodArray) {
    if (Array.isArray(data)) {
      // First check if the array itself has a reference (for MANY_TO_MANY relationships)
      if (hasReference(schema)) {
        const reference = getReference(schema);

        if (reference) {
          // Try to find the collection by reference name or by schema description
          let collection = options.dependencies?.[reference.name];

          // If collection not found by name, try to extract name from schema description
          if (!collection && reference.schema._def.description) {
            const schemaDesc = reference.schema._def.description;

            // Try to extract a better name from the description
            const match =
              schemaDesc.match(/^An? (.+?) with/i) ||
              schemaDesc.match(/^An? (.+?) in/i) ||
              schemaDesc.match(/^An? (.+?)$/i);

            if (match) {
              const extractedName = match[1].toLowerCase();
              collection = options.dependencies?.[extractedName];
            }
          }

          if (collection) {
            const foreignField = reference.foreignField;

            // Check each item in the array
            data.forEach((item, index) => {
              // Skip null or undefined values
              if (item === null || item === undefined) return;

              const itemPath = [...currentPath, index];
              const referencedItem = collection.find(
                (collectionItem) => collectionItem[foreignField] === item
              );

              if (!referencedItem) {
                // Use the extracted name from schema description if available
                const refName = reference.schema._def.description
                  ? (() => {
                      const match =
                        reference.schema._def.description.match(
                          /^An? (.+?) with/i
                        ) ||
                        reference.schema._def.description.match(
                          /^An? (.+?) in/i
                        ) ||
                        reference.schema._def.description.match(/^An? (.+?)$/i);
                      return match ? match[1].toLowerCase() : reference.name;
                    })()
                  : reference.name;

                issues.push({
                  code: z.ZodIssueCode.custom,
                  path: itemPath,
                  message: `Referenced ${refName} with ${foreignField}=${item} not found`,
                });
              }
            });
          }
        }
      }

      // Then recursively validate each item's schema
      data.forEach((item, index) => {
        const itemPath = [...currentPath, index];
        // Use the element schema for array items
        const elementSchema = schema.element as z.ZodTypeAny;

        // Special handling for array elements that are strings with references
        if (
          (elementSchema instanceof z.ZodString ||
            (elementSchema instanceof z.ZodOptional &&
              elementSchema._def.innerType instanceof z.ZodString)) &&
          hasReference(
            elementSchema instanceof z.ZodOptional
              ? elementSchema._def.innerType
              : elementSchema
          )
        ) {
          const reference = getReference(
            elementSchema instanceof z.ZodOptional
              ? elementSchema._def.innerType
              : elementSchema
          );

          if (reference) {
            // Try to find the collection by reference name or by schema description
            let collection = options.dependencies?.[reference.name];

            // If collection not found by name, try to extract name from schema description
            if (!collection && reference.schema._def.description) {
              const schemaDesc = reference.schema._def.description;

              // Try to extract a better name from the description
              const match =
                schemaDesc.match(/^An? (.+?) with/i) ||
                schemaDesc.match(/^An? (.+?) in/i) ||
                schemaDesc.match(/^An? (.+?)$/i);

              if (match) {
                const extractedName = match[1].toLowerCase();
                collection = options.dependencies?.[extractedName];
              }
            }

            if (collection) {
              const foreignField = reference.foreignField;

              const referencedItem = collection.find(
                (collectionItem) => collectionItem[foreignField] === item
              );

              if (!referencedItem) {
                issues.push({
                  code: z.ZodIssueCode.custom,
                  path: itemPath,
                  message: `Referenced ${reference.name} with ${foreignField}=${item} not found`,
                });
              }
            }
          }
        }

        // Skip null or undefined values for recursive validation
        if (item !== null && item !== undefined) {
          // Continue with normal recursive validation
          const itemIssues = validateReferences(
            elementSchema,
            item,
            options,
            itemPath
          );
          issues.push(...itemIssues);
        }
      });

      // Remove this path from visited paths when we're done with this array
      options.visitedPaths?.delete(visitKey);
    }
  }
  // Handle references
  else if (
    hasReference(schema) ||
    (schema instanceof z.ZodOptional && hasReference(schema._def.innerType))
  ) {
    const reference = getReference(
      schema instanceof z.ZodOptional ? schema._def.innerType : schema
    );

    if (reference && data !== undefined && data !== null) {
      // Try to find the collection by reference name or by schema description
      let collection = options.dependencies?.[reference.name];

      // If collection not found by name, try to extract name from schema description
      if (!collection && reference.schema._def.description) {
        const schemaDesc = reference.schema._def.description;

        // Try to extract a better name from the description
        const match =
          schemaDesc.match(/^An? (.+?) with/i) ||
          schemaDesc.match(/^An? (.+?) in/i) ||
          schemaDesc.match(/^An? (.+?)$/i);

        if (match) {
          const extractedName = match[1].toLowerCase();
          collection = options.dependencies?.[extractedName];
        }
      }

      if (collection) {
        const foreignField = reference.foreignField;

        const referencedItem = collection.find(
          (item) => item[foreignField] === data
        );

        if (!referencedItem) {
          issues.push({
            code: z.ZodIssueCode.custom,
            path: currentPath,
            message: `Referenced ${reference.name} with ${foreignField}=${data} not found`,
          });
        }
      }
    }
  }

  // Remove this path from visited paths when we're done with this reference
  options.visitedPaths?.delete(visitKey);

  return issues;
}
