import React, { useMemo } from "react";
import { context as uniformsContext } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField } from "uniforms-mui";
import BelongsToField from "./BelongsToField";
import HasManyField from "./HasManyField";
import { useObject } from "./ObjectProvider";
import {
  BELONGS_TO_FIELD,
  createReferenceFieldsComponentDetector,
  HAS_MANY_FIELD,
} from "./ReferenceField";

// Import Material-UI components from their specific paths
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";

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

  /**
   * Optional object ID to use for the data-object-id attribute
   * If not provided, will use the objectId from useObject()
   */
  objectId?: string;

  /**
   * Function to generate header content
   * Takes object data and object type as parameters
   * If returns empty string, header will not be displayed
   */
  header?: (data: any, objectType: string) => string;

  /**
   * Whether to use a Card container
   * Defaults to true
   */
  useCard?: boolean;

  /**
   * Card variant to use
   * Set to empty string for no appearance
   * Defaults to "outlined"
   */
  cardVariant?: "outlined" | "elevation" | "";
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
  objectId: propObjectId,
  header,
  useCard = true,
  cardVariant = "outlined",
}: ObjectFieldsetProps) {
  // Get object data and schema from ObjectProvider
  const {
    schema,
    data,
    objectType,
    objectId: contextObjectId,
    updateData,
  } = useObject(objectKey);

  // Register custom field types with Uniforms
  const fieldTypes = {
    [BELONGS_TO_FIELD]: BelongsToField,
    [HAS_MANY_FIELD]: HasManyField,
  };

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

      // Register custom field types
      uniforms: {
        fieldTypes,
        objectType,
      },
    };
  }, [schema, data, updateData, objectKey, showInlineError, objectType]);

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

  // Determine the header text
  const headerText = useMemo(() => {
    // If header function is provided, use it with highest priority
    if (header) {
      return header(data, objectType);
    }

    // Default behavior: objectType: name or _id
    const displayName = data?.name || data?._id;
    return displayName ? `${objectType}: ${displayName}` : "";
  }, [header, data, objectType]);

  // Create the content element with data attributes only when useCard is false
  const contentElement = (
    <div
      className={className}
      {...(!useCard && {
        "data-testid": "ObjectFieldset",
        "data-object-type": objectType,
        ...((propObjectId !== undefined ? propObjectId : contextObjectId) !==
          undefined && {
          "data-object-id":
            propObjectId !== undefined ? propObjectId : contextObjectId,
        }),
      })}
    >
      {/* Provide the uniforms context */}
      {/* @ts-ignore - The context value doesn't match exactly what uniforms expects */}
      <uniformsContext.Provider value={formContext}>
        {/* Set up component detector context for reference fields */}
        <AutoField.componentDetectorContext.Provider
          value={createReferenceFieldsComponentDetector(schema, objectType)}
        >
          {/* Render fields with consistent spacing using Stack */}
          <Stack spacing={2}>
            {filteredFields.map((field: string) => (
              <AutoField
                key={field}
                name={field}
                showInlineError={showInlineError}
              />
            ))}
            {children}
          </Stack>
        </AutoField.componentDetectorContext.Provider>
      </uniformsContext.Provider>
    </div>
  );

  // If not using Card, just return the content element
  if (!useCard) {
    return contentElement;
  }

  // Using Card with optional header and data attributes
  return (
    <Card
      variant={cardVariant ? (cardVariant as any) : undefined}
      data-testid="ObjectFieldset"
      data-object-type={objectType}
      {...((propObjectId !== undefined ? propObjectId : contextObjectId) !==
        undefined && {
        "data-object-id":
          propObjectId !== undefined ? propObjectId : contextObjectId,
      })}
    >
      {headerText && (
        <CardHeader
          title={headerText}
          titleTypographyProps={{ variant: "subtitle1" }}
        />
      )}
      <CardContent>{contentElement}</CardContent>
    </Card>
  );
}

export default ObjectFieldset;
