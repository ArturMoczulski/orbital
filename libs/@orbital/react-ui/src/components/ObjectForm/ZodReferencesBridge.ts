import {
  getReference,
  getSchemaName,
  hasReference,
  RelationshipType,
  z,
} from "@orbital/core";
import { parseWithReferences } from "@orbital/core/src/zod/reference/parser";
import { camelCase, startCase } from "lodash";
import { ZodBridge } from "uniforms-bridge-zod";

// Component names as constants to avoid typos and make refactoring easier
const HAS_MANY_FIELD = "HasManyField";
const BELONGS_TO_FIELD = "BelongsToField";
const RECURSIVE_RELATIONSHIP_FIELD = "RecursiveRelationshipField";
const PARENT_FIELD = "ParentField";
const CHILDREN_FIELD = "ChildrenField";

export class ZodReferencesBridge<T extends z.ZodType<any, any, any>> {
  // Store the schema and bridge instance
  public schema: T;
  private bridge: ZodBridge<T>;
  // Store dependencies for reference validation
  private dependencies?: Record<string, any[]>;

  constructor(options: {
    schema: T;
    dependencies?: Record<string, any[]>;
    provideDefaultLabelFromFieldName?: boolean;
  }) {
    this.schema = options.schema;
    this.bridge = new ZodBridge({
      schema: options.schema,
      provideDefaultLabelFromFieldName:
        options.provideDefaultLabelFromFieldName ?? true,
    });
    this.dependencies = options.dependencies;
  }

  // Delegate methods to the underlying ZodBridge
  getInitialModel() {
    return this.bridge.getInitialModel();
  }

  getInitialValue(name: string) {
    return this.bridge.getInitialValue(name);
  }

  getProps(name: string) {
    return this.bridge.getProps(name);
  }

  getSubfields(name?: string) {
    return this.bridge.getSubfields(name);
  }

  getType(name: string) {
    return this.bridge.getType(name);
  }

  getError(name: string, error: any) {
    return this.bridge.getError(name, error);
  }

  getErrorMessage(name: string, error: any) {
    return this.bridge.getErrorMessage(name, error);
  }

  getErrorMessages(error: any) {
    return this.bridge.getErrorMessages(error);
  }

  // Helper method to get a subschema from a path
  private getSubschema(name: string): z.ZodType<any> {
    try {
      // Handle nested paths like 'address.street'
      const path = name.split(".");
      let schema: any = this.schema;

      // For simple fields, just return the field schema
      if (path.length === 1) {
        // Check if schema is a ZodObject with a shape property
        if (
          schema &&
          typeof schema === "object" &&
          "shape" in schema &&
          schema.shape &&
          typeof schema.shape === "object" &&
          name in schema.shape
        ) {
          return schema.shape[name];
        }
      }

      // For nested fields, traverse the schema
      for (const segment of path) {
        if (
          schema &&
          typeof schema === "object" &&
          "shape" in schema &&
          schema.shape &&
          typeof schema.shape === "object" &&
          segment in schema.shape
        ) {
          schema = schema.shape[segment];
        } else {
          // If we can't find the field, return a generic schema
          console.log(`Could not find segment ${segment} in schema shape`);
          return z.any();
        }
      }

      return schema;
    } catch (error) {
      // If anything goes wrong, return a generic schema
      console.error(`Error in getSubschema for ${name}:`, error);
      return z.any();
    }
  }

  // Override getField to add reference metadata
  getField(name: string): any {
    try {
      // Try to get the field from the bridge
      const field = this.bridge.getField(name);

      // Get the schema for this field
      const schema = this.getSubschema(name);

      // Add type information from the schema
      const fieldWithType = {
        ...field,
        type:
          schema instanceof z.ZodString
            ? "string"
            : schema instanceof z.ZodArray
              ? "array"
              : schema instanceof z.ZodObject
                ? "object"
                : schema instanceof z.ZodNumber
                  ? "number"
                  : schema instanceof z.ZodBoolean
                    ? "boolean"
                    : undefined,
        uniforms: field.uniforms || {},
      };

      // Check if the field has a reference
      if (hasReference(schema)) {
        const reference = getReference(schema);
        if (!reference) return fieldWithType;

        // Get the options for this reference
        const options = this.dependencies?.[reference.name] || [];

        // Determine the appropriate component based on relationship type
        let component;
        let multiple = false;

        if (reference.type === RelationshipType.RECURSIVE) {
          // For RECURSIVE, determine if it's multiple based on schema type
          multiple = schema instanceof z.ZodArray;

          // Use specialized components based on whether it's a single or multiple selection
          if (multiple) {
            // For multiple selection (children), use ChildrenField
            component = CHILDREN_FIELD;
          } else {
            // For single selection (parent), use ParentField
            component = PARENT_FIELD;
          }
        } else if (
          reference.type === RelationshipType.MANY_TO_MANY ||
          reference.type === RelationshipType.HAS_MANY
        ) {
          component = HAS_MANY_FIELD;
        } else {
          component = BELONGS_TO_FIELD;
        }

        // Add reference metadata to the field
        return {
          ...fieldWithType,
          reference: {
            ...reference,
            options,
          },
          uniforms: {
            ...fieldWithType.uniforms,
            component,
            multiple, // Only used by RecursiveField
          },
        };
      }

      return fieldWithType;
    } catch (error) {
      // For any errors, create a basic field with the required properties
      return {
        type: "string",
        uniforms: {},
      };
    }
  }

  // Get all references in the schema
  getReferences(): Record<string, any> {
    const references: Record<string, any> = {};

    try {
      // Get all top-level fields
      const fields = this.getSubfields();

      // For each field, check if it has a reference
      for (const field of fields) {
        try {
          // First try to get the field info using getField
          const fieldInfo = this.getField(field);

          // If the field has reference metadata from getField, use it
          if (fieldInfo?.reference) {
            references[field] = fieldInfo.reference;
            continue;
          }

          // If getField didn't find a reference, try to access the schema directly
          // This is a more direct approach that bypasses potential issues with getSubschema
          if (
            this.schema &&
            typeof this.schema === "object" &&
            "shape" in this.schema &&
            this.schema.shape &&
            typeof this.schema.shape === "object" &&
            field in this.schema.shape
          ) {
            const fieldSchema = this.schema.shape[
              field as keyof typeof this.schema.shape
            ] as z.ZodType<any>;

            // Check if fieldSchema has a _def property with a reference
            if (
              fieldSchema &&
              typeof fieldSchema === "object" &&
              "_def" in fieldSchema &&
              fieldSchema._def &&
              typeof fieldSchema._def === "object" &&
              "reference" in fieldSchema._def
            ) {
              const reference = fieldSchema._def.reference as {
                name: string;
                type: RelationshipType;
              };
              if (reference) {
                // Get the options for this reference
                const options = this.dependencies?.[reference.name] || [];

                // Add to references with options
                references[field] = {
                  ...reference,
                  options,
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error getting reference for field ${field}:`, error);
        }
      }
    } catch (error) {
      console.error("Error getting references:", error);
    }

    return references;
  }

  // Get a validator function that uses parseWithReferences
  getValidator(): (model: Record<string, unknown>) => z.ZodError<T> | null {
    const standardValidator = this.bridge.getValidator();
    const dependencies = this.dependencies;
    const schema = this.schema;

    return (model: Record<string, unknown>) => {
      // If we have dependencies, use parseWithReferences
      if (dependencies) {
        // Add maxDepth option to prevent excessive recursion
        // and log dependencies for debugging
        console.log(
          "Validating with dependencies:",
          Object.keys(dependencies).map(
            (key) => `${key}: ${dependencies[key]?.length || 0} items`
          )
        );

        const result = parseWithReferences(schema, model, {
          dependencies,
          maxDepth: 2, // Limit recursion depth to prevent excessive validation
        });

        if (!result.success && result.error) {
          console.error("Reference validation failed:", result.error);
          return result.error;
        }
        return null;
      }

      // Otherwise use the standard validator
      return standardValidator(model);
    };
  }
}

/**
 * Attempts to infer the object type from a schema
 * @param schema The schema to infer the object type from
 * @returns The inferred object type or "Unknown" if it can't be determined
 */
// Use lodash's startCase and camelCase to create Pascal case
// (startCase('foo-bar') -> 'Foo Bar', so we need to remove spaces with replace)
const toPascalCase = (str: string): string =>
  startCase(camelCase(str)).replace(/\s/g, "");

/**
 * Attempts to infer the object type from a schema using the core library's getSchemaName function
 * @param schema The schema to infer the object type from
 * @returns The inferred object type in Pascal case, or "Unknown" if it can't be determined
 */
export function inferObjectTypeFromSchema(
  schema: ZodBridge<any> | ZodReferencesBridge<any>
): string {
  try {
    // Get the raw schema from either ZodBridge or ZodReferencesBridge
    const rawSchema =
      schema instanceof ZodReferencesBridge
        ? schema.schema
        : schema instanceof ZodBridge
          ? schema.schema
          : null;

    if (!rawSchema) {
      return "Unknown";
    }

    // Check for direct description that might contain the type
    if (rawSchema._def.description) {
      // Try to extract type from description like "A User"
      const directMatch = rawSchema._def.description.match(/^A (\w+)$/i);
      if (directMatch) {
        return toPascalCase(directMatch[1]);
      }
    }

    // Use the existing getSchemaName function from @orbital/core
    const schemaName = getSchemaName(rawSchema);

    // Convert to Pascal case
    if (schemaName && schemaName.length > 0) {
      const objectType = toPascalCase(schemaName);
      return objectType;
    }

    return "Unknown";
  } catch (error) {
    console.error("Error inferring object type:", error);
    return "Unknown";
  }
}
