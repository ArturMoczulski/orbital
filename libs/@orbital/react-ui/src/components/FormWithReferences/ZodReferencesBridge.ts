import { parseWithReferences } from "@orbital/core/src/zod/reference/parser";
import {
  getReference,
  hasReference,
  RelationshipType,
} from "@orbital/core/src/zod/reference/reference";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";

// Component names as constants to avoid typos and make refactoring easier
const REFERENCE_ARRAY_FIELD = "ReferenceArrayField";
const REFERENCE_SINGLE_FIELD = "ReferenceSingleField";

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
      if (path.length === 1 && schema instanceof z.ZodObject) {
        return schema.shape[name] as z.ZodType<any>;
      }

      // For nested fields, traverse the schema
      for (const segment of path) {
        if (schema instanceof z.ZodObject && segment in schema.shape) {
          schema = schema.shape[segment];
        } else {
          // If we can't find the field, return a generic schema
          return z.any();
        }
      }

      return schema as z.ZodType<any>;
    } catch (error) {
      // If anything goes wrong, return a generic schema
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

        // Debug: Log reference information
        console.log(`Field ${name} has reference:`, reference);
        console.log(`Dependencies for ${reference.name}:`, options);

        // Add reference metadata to the field
        return {
          ...fieldWithType,
          reference: {
            ...reference,
            options,
          },
          uniforms: {
            ...fieldWithType.uniforms,
            // Set the component to ReferenceArrayField or ReferenceSingleField
            component:
              reference.type === RelationshipType.MANY_TO_MANY
                ? REFERENCE_ARRAY_FIELD
                : REFERENCE_SINGLE_FIELD,
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

  // Get a validator function that uses parseWithReferences
  getValidator(): (model: Record<string, unknown>) => z.ZodError<T> | null {
    const standardValidator = this.bridge.getValidator();
    const dependencies = this.dependencies;
    const schema = this.schema;

    return (model: Record<string, unknown>) => {
      // If we have dependencies, use parseWithReferences
      if (dependencies) {
        const result = parseWithReferences(schema, model, { dependencies });
        if (!result.success && result.error) {
          return result.error;
        }
        return null;
      }

      // Otherwise use the standard validator
      return standardValidator(model);
    };
  }
}
