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
  console.log("=== PARSE WITH REFERENCES ===");
  console.log("Schema type:", schema.constructor.name);
  console.log(
    "Schema description:",
    schema._def.description || "unnamed schema"
  );
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log(
    "Dependencies:",
    options.dependencies ? Object.keys(options.dependencies) : "none"
  );

  // Special debug for CharacterSchema test case
  if (schema._def.description === "A character with name") {
    console.log("*** PROCESSING CHARACTER SCHEMA ***");
    if ((data as any)?.areaIds) {
      console.log("areaIds:", (data as any).areaIds);

      // Check if we're testing the invalid case with "nonexistent"
      if ((data as any).areaIds.includes("nonexistent")) {
        console.log("*** DETECTED TEST CASE WITH NONEXISTENT AREA ***");
      }
    }
  }

  if (
    schema.constructor.name === "ZodObject" &&
    (schema as any)._def.typeName === "ZodObject"
  ) {
    console.log("Object shape keys:", Object.keys((schema as any).shape));
  }

  // First do standard Zod validation
  const result = schema.safeParse(data);
  console.log(
    "Standard Zod validation result:",
    result.success ? "PASS" : "FAIL"
  );
  if (!result.success) {
    console.log(
      "Zod validation errors:",
      JSON.stringify(result.error.issues, null, 2)
    );
    return result;
  }

  // Then validate references if dependencies are provided
  if (options.dependencies) {
    console.log("Validating references with dependencies...");
    // Initialize visitedPaths if not provided
    if (!options.visitedPaths) {
      options.visitedPaths = new Set<string>();
    }

    // Set default maxDepth if not provided
    if (options.maxDepth === undefined) {
      options.maxDepth = 1; // Default to only validating immediate relationships
    }

    const referenceErrors = validateReferences(schema, data, options);
    console.log("Reference validation errors:", referenceErrors.length);

    if (referenceErrors.length > 0) {
      console.log(
        "Reference error details:",
        JSON.stringify(referenceErrors, null, 2)
      );

      // Create a ZodError with the reference validation issues
      const error = new z.ZodError(referenceErrors);
      return { success: false, error };
    }
  }

  // If we got here, validation passed
  console.log("All validation passed");
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

  console.log(`\n--- VALIDATE REFERENCES [${pathStr}] ---`);
  console.log(`Schema type: ${schema.constructor.name}`);
  console.log(`Data: ${JSON.stringify(data, null, 2)}`);

  // Check for maximum recursion depth
  if (options.maxDepth !== undefined && currentPath.length > options.maxDepth) {
    console.log(`Maximum recursion depth reached at path: ${pathStr}`);
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
    console.log(`Circular reference detected at path: ${pathStr}`);
    console.log(`Already visited: ${visitKey}`);
    // We don't add an issue for circular references - we just stop recursion
    // This allows circular references to exist without validation errors
    return issues;
  }

  // Add this schema-data pair to visited paths
  options.visitedPaths?.add(visitKey);

  // Handle object schemas
  if (schema instanceof z.ZodObject) {
    console.log(
      `Object schema with keys: ${Object.keys(schema.shape).join(", ")}`
    );

    Object.entries(schema.shape).forEach(([key, fieldSchema]) => {
      const fieldPath = [...currentPath, key];
      const fieldValue = data?.[key];

      console.log(`\nChecking field: ${key}`);
      console.log(`Field value: ${JSON.stringify(fieldValue)}`);
      console.log(
        `Field schema type: ${(fieldSchema as z.ZodTypeAny).constructor.name}`
      );

      // Recursively validate nested fields
      if (fieldValue !== undefined) {
        // Cast to ZodTypeAny to ensure type safety
        const zodFieldSchema = fieldSchema as z.ZodTypeAny;

        // Check if this field schema has a reference
        if (hasReference(zodFieldSchema)) {
          const ref = getReference(zodFieldSchema);
          console.log(`Field ${key} has reference to: ${ref?.name}`);
        }

        const fieldIssues = validateReferences(
          zodFieldSchema,
          fieldValue,
          options,
          fieldPath
        );

        console.log(`Field ${key} issues: ${fieldIssues.length}`);
        if (fieldIssues.length > 0) {
          console.log(
            `Field ${key} issue details:`,
            JSON.stringify(fieldIssues, null, 2)
          );
        }

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
      console.log(`Array schema with ${data.length} items`);
      console.log(`Array data: ${JSON.stringify(data)}`);
      console.log(`Element schema type: ${schema.element.constructor.name}`);

      // First check if the array itself has a reference (for MANY_TO_MANY relationships)
      if (hasReference(schema)) {
        const reference = getReference(schema);
        console.log(`Array has reference to: ${reference?.name}`);
        console.log(`Reference type: ${reference?.type}`);
        console.log(`Reference foreign field: ${reference?.foreignField}`);

        if (reference) {
          // Try to find the collection by reference name or by schema description
          let collection = options.dependencies?.[reference.name];

          // Debug the collection lookup
          console.log(`Looking for collection with name: ${reference.name}`);
          console.log(
            `Available dependencies: ${Object.keys(options.dependencies || {}).join(", ")}`
          );

          // If collection not found by name, try to extract name from schema description
          if (!collection && reference.schema._def.description) {
            const schemaDesc = reference.schema._def.description;
            console.log(`Schema description: ${schemaDesc}`);

            // Try to extract a better name from the description
            const match =
              schemaDesc.match(/^An? (.+?) with/i) ||
              schemaDesc.match(/^An? (.+?) in/i) ||
              schemaDesc.match(/^An? (.+?)$/i);

            if (match) {
              const extractedName = match[1].toLowerCase();
              console.log(`Extracted name from description: ${extractedName}`);
              collection = options.dependencies?.[extractedName];

              if (collection) {
                console.log(
                  `Found collection using extracted name: ${extractedName}`
                );
              }
            }
          }

          console.log(
            `Collection ${reference.name} exists: ${!!collection}, items: ${collection?.length || 0}`
          );

          if (collection) {
            console.log(`Collection data: ${JSON.stringify(collection)}`);
            const foreignField = reference.foreignField;

            // Check each item in the array
            data.forEach((item, index) => {
              // Skip null or undefined values
              if (item === null || item === undefined) return;

              console.log(`Checking array item[${index}]: ${item}`);

              const itemPath = [...currentPath, index];
              const referencedItem = collection.find(
                (collectionItem) => collectionItem[foreignField] === item
              );

              console.log(
                `Referenced item found for array[${index}]: ${!!referencedItem}`
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

                console.log(`Adding issue for array item[${index}]: ${item}`);
                issues.push({
                  code: z.ZodIssueCode.custom,
                  path: itemPath,
                  message: `Referenced ${refName} with ${foreignField}=${item} not found`,
                });
              }
            });
          } else {
            console.log(
              `Collection ${reference.name} not found in dependencies`
            );
          }
        }
      }

      // Then recursively validate each item's schema
      data.forEach((item, index) => {
        const itemPath = [...currentPath, index];
        // Use the element schema for array items
        const elementSchema = schema.element as z.ZodTypeAny;

        console.log(
          `\nRecursively validating array item[${index}]: ${JSON.stringify(item)}`
        );

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
          console.log(
            `Array element has string reference to: ${reference?.name}`
          );

          if (reference) {
            // Try to find the collection by reference name or by schema description
            let collection = options.dependencies?.[reference.name];

            // Debug the collection lookup
            console.log(`Looking for collection with name: ${reference.name}`);
            console.log(
              `Available dependencies: ${Object.keys(options.dependencies || {}).join(", ")}`
            );

            // If collection not found by name, try to extract name from schema description
            if (!collection && reference.schema._def.description) {
              const schemaDesc = reference.schema._def.description;
              console.log(`Schema description: ${schemaDesc}`);

              // Try to extract a better name from the description
              const match =
                schemaDesc.match(/^An? (.+?) with/i) ||
                schemaDesc.match(/^An? (.+?) in/i) ||
                schemaDesc.match(/^An? (.+?)$/i);

              if (match) {
                const extractedName = match[1].toLowerCase();
                console.log(
                  `Extracted name from description: ${extractedName}`
                );
                collection = options.dependencies?.[extractedName];

                if (collection) {
                  console.log(
                    `Found collection using extracted name: ${extractedName}`
                  );
                }
              }
            }

            console.log(
              `Collection ${reference.name} exists: ${!!collection}, items: ${collection?.length || 0}`
            );

            if (collection) {
              const foreignField = reference.foreignField;

              console.log(
                `Checking string array item[${index}]: ${item} against ${reference.name}.${foreignField}`
              );

              const referencedItem = collection.find(
                (collectionItem) => collectionItem[foreignField] === item
              );

              console.log(
                `Referenced item found for array[${index}]: ${!!referencedItem}`
              );

              if (!referencedItem) {
                console.log(`Adding issue for array item[${index}]: ${item}`);
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
          console.log(`Array item[${index}] issues: ${itemIssues.length}`);
          if (itemIssues.length > 0) {
            console.log(
              `Array item[${index}] issue details:`,
              JSON.stringify(itemIssues, null, 2)
            );
          }
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
    console.log(`Field has reference to: ${reference?.name}`);
    console.log(`Reference type: ${reference?.type}`);
    console.log(`Reference foreign field: ${reference?.foreignField}`);

    if (reference && data !== undefined && data !== null) {
      // Try to find the collection by reference name or by schema description
      let collection = options.dependencies?.[reference.name];

      // Debug the collection lookup
      console.log(`Looking for collection with name: ${reference.name}`);
      console.log(
        `Available dependencies: ${Object.keys(options.dependencies || {}).join(", ")}`
      );

      // If collection not found by name, try to extract name from schema description
      if (!collection && reference.schema._def.description) {
        const schemaDesc = reference.schema._def.description;
        console.log(`Schema description: ${schemaDesc}`);

        // Try to extract a better name from the description
        const match =
          schemaDesc.match(/^An? (.+?) with/i) ||
          schemaDesc.match(/^An? (.+?) in/i) ||
          schemaDesc.match(/^An? (.+?)$/i);

        if (match) {
          const extractedName = match[1].toLowerCase();
          console.log(`Extracted name from description: ${extractedName}`);
          collection = options.dependencies?.[extractedName];

          if (collection) {
            console.log(
              `Found collection using extracted name: ${extractedName}`
            );
          }
        }
      }

      console.log(
        `Collection ${reference.name} exists: ${!!collection}, items: ${collection?.length || 0}`
      );

      if (collection) {
        console.log(`Collection data: ${JSON.stringify(collection)}`);
        const foreignField = reference.foreignField;
        console.log(`Checking reference: ${data} against ${foreignField}`);

        const referencedItem = collection.find(
          (item) => item[foreignField] === data
        );

        console.log(`Referenced item found: ${!!referencedItem}`);

        if (!referencedItem) {
          console.log(`Adding issue for reference: ${data}`);
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

  console.log(`Returning ${issues.length} issues for path: ${pathStr}`);
  return issues;
}
