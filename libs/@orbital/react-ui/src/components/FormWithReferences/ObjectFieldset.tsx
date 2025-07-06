import React, { useMemo } from "react";
import { context as uniformsContext } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField } from "uniforms-mui";
import { useObject } from "./ObjectProvider";

/**
 * Props for the ObjectFieldset component
 */
export interface ObjectFieldsetProps {
  /**
   * The key to use for accessing object data from the ObjectProvider
   * Defaults to 'main'
   */
  objectKey?: string;

  /**
   * Optional list of field names to include
   * If not provided, all fields from the schema will be used
   */
  fields?: string[];

  /**
   * Optional list of field names to exclude
   */
  omitFields?: string[];

  /**
   * Whether to show inline error messages
   */
  showInlineError?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Optional children to render after the fields
   */
  children?: React.ReactNode;
}

/**
 * A component that renders form fields for an object without a surrounding form element.
 * Uses the ObjectProvider context to access schema and data.
 */
export function ObjectFieldset({
  objectKey = "main",
  fields,
  omitFields = [],
  showInlineError,
  className,
  children,
}: ObjectFieldsetProps) {
  // Get object data and schema from ObjectProvider
  const { schema, data, objectType, updateData } = useObject(objectKey);

  // Create a uniforms-compatible context
  const formContext = useMemo(() => {
    return {
      // Schema access
      schema,

      // Data access
      model: data,

      // Change handler
      onChange: (key: string, value: any) => {
        // Update a single field
        updateData({ [key]: value }, true);
      },

      // Other required context properties
      error: null,
      state: {
        disabled: false,
        readOnly: false,
        showInlineError: !!showInlineError,
      },

      // Helper functions
      randomId: () => `${objectKey}-${Math.random().toString(36).substring(2)}`,
      name: [],

      // These properties are required by uniforms but not used in our case
      submitted: false,
      submitting: false,
      validating: false,
      changed: false,
      changedMap: {},

      // Required by some field components
      findError: () => null,
      findField: () => null,
      findValue: (name: string) => {
        const parts = name.split(".");
        let value = data;
        for (const part of parts) {
          if (value === undefined || value === null) return undefined;
          value = value[part];
        }
        return value;
      },
    };
  }, [schema, data, updateData, objectKey, showInlineError]);

  // Get field names from schema if not provided
  const fieldNames = useMemo(() => {
    if (fields) return fields;

    // Try to get subfields from the schema using the bridge API
    if ("getSubfields" in schema && typeof schema.getSubfields === "function") {
      return schema.getSubfields();
    }

    // For ZodBridge or ZodReferencesBridge
    if (schema instanceof ZodBridge || "getInitialModel" in schema) {
      const initialModel =
        "getInitialModel" in schema ? schema.getInitialModel() : {};
      return Object.keys(initialModel);
    }

    // For raw Zod schema
    if ("_def" in schema && schema._def) {
      try {
        // @ts-ignore - Accessing internal Zod API
        if (schema._def && typeof schema._def === "object") {
          // Try to access shape safely
          const def = schema._def as any;
          const shape =
            def.shape && typeof def.shape === "function" ? def.shape() : null;
          if (shape) {
            return Object.keys(shape);
          }
        }
      } catch (e) {
        console.warn("Could not get fields from Zod schema shape", e);
      }
    }

    // Last resort: try to get keys from the data
    return Object.keys(data);
  }, [schema, fields, data]);

  // Filter out omitted fields
  const filteredFields = useMemo(() => {
    return fieldNames.filter((field: string) => !omitFields.includes(field));
  }, [fieldNames, omitFields]);

  return (
    <div
      className={className}
      data-testid={`${objectType}ObjectFieldset`}
      data-object-id={objectKey}
      data-object-type={objectType}
    >
      {/* Provide the uniforms context */}
      {/* @ts-ignore - The context value doesn't match exactly what uniforms expects */}
      <uniformsContext.Provider value={formContext}>
        {/* Render fields */}
        {filteredFields.map((field: string) => (
          <AutoField
            key={field}
            name={field}
            showInlineError={showInlineError}
          />
        ))}
        {children}
      </uniformsContext.Provider>
    </div>
  );
}

export default ObjectFieldset;
