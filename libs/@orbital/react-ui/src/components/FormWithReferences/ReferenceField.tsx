import {
  ReferenceMetadata,
  RelationshipType,
} from "@orbital/core/src/zod/reference/reference";
import { camelCase, startCase } from "lodash";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField } from "uniforms-mui";
import { z } from "zod";
import { ObjectSelector } from "../ObjectSelector/ObjectSelector";
import BelongsToField from "./BelongsToField";
import HasManyField from "./HasManyField";
import { useObject } from "./ObjectProvider";
import { useObjectSchema } from "./ObjectSchemaContext";
import {
  inferObjectTypeFromSchema,
  ZodReferencesBridge,
} from "./ZodReferencesBridge";

// Component names as constants to avoid typos and make refactoring easier
export const HAS_MANY_FIELD = "HasManyField";
export const BELONGS_TO_FIELD = "BelongsToField";

export type ReferenceFieldProps = {
  // Common props
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  id: string;
  label?: string;
  name: string;
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value?: string | string[];

  // Reference-specific props
  reference?: ReferenceMetadata & {
    options: any[];
  };
  schema?: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>; // Now optional, can be provided via context
  objectType?: string; // Optional prop to specify the containing object type, can be provided via context

  // Filtering props for recursive relationships
  currentId?: string; // ID of the current item to filter out from options

  // Display and behavior props
  multiple?: boolean; // Whether this is a multi-select field
  idField?: string; // Field to use as the ID/value (default: "_id")
  displayField?: string; // Field to display (default: "name")

  // Testing props
  "data-testid"?: string; // Allow passing a custom testid
  objectId?: string; // Optional prop to override the object ID from context
};

/**
 * ReferenceField is an abstraction component that sits between ObjectSelector and
 * the relationship field components (BelongsToField, HasManyField, ParentField, ChildrenField).
 * It handles common logic around object types, labels, and reference handling.
 */
/**
 * ReferenceField is an abstraction component that sits between ObjectSelector and
 * the relationship field components (BelongsToField, HasManyField, ParentField, ChildrenField).
 * It handles common logic around object types, labels, and reference handling.
 */
export function ReferenceField({
  disabled,
  error,
  errorMessage,
  id,
  label,
  name,
  onChange,
  placeholder,
  readOnly,
  required,
  value,
  reference,
  schema,
  objectType: providedObjectType,
  currentId,
  multiple = false,
  idField: customIdField,
  displayField: customDisplayField,
  "data-testid": dataTestId,
  objectId,
}: ReferenceFieldProps) {
  // Try to get schema, objectType, and objectId from context if not provided as props
  let contextSchema;
  let contextObjectType;
  let contextObjectId;

  try {
    const schemaContext = useObjectSchema();
    contextSchema = schemaContext.schema;
    contextObjectType = schemaContext.objectType;

    // Try to get objectId from the object context
    try {
      const objectContext = useObject();
      contextObjectId = objectContext.objectId;
    } catch (error) {
      // Object context not available, will use props only
    }
  } catch (error) {
    // Schema context not available, will use props only
  }

  // Use provided schema or get from context
  const finalSchema = schema || contextSchema;
  if (!finalSchema) {
    throw new Error(
      "ReferenceField requires a schema prop or to be within an ObjectSchemaProvider"
    );
  }

  // Use provided objectType, or get from context, or infer from schema
  const objectType =
    providedObjectType ||
    contextObjectType ||
    (() => {
      if (
        finalSchema instanceof ZodReferencesBridge ||
        finalSchema instanceof ZodBridge
      ) {
        const inferredType = inferObjectTypeFromSchema(finalSchema);
        if (inferredType === "Unknown") {
          throw new Error(
            "Could not infer object type from schema. Please provide an objectType prop."
          );
        }
        return inferredType;
      }
      throw new Error(
        "Schema must be a ZodReferencesBridge or ZodBridge to infer object type. Please provide an objectType prop."
      );
    })();
  // Convert string to PascalCase (e.g., "hello_world" -> "HelloWorld")
  const toPascalCase = (str: string): string =>
    startCase(camelCase(str)).replace(/\s/g, "");

  // Helper to get a proper label from field name or reference
  const getLabel = (): string | undefined => {
    // Use provided label if available
    if (label) return label;

    // Use reference name if available
    if (reference?.name) return toPascalCase(reference.name);

    // Extract reference name from field name based on pattern
    if (multiple && name.endsWith("Ids")) {
      const referenceName = name.slice(0, -3); // Remove 'Ids' suffix
      return toPascalCase(referenceName);
    } else if (!multiple && name.endsWith("Id")) {
      const referenceName = name.slice(0, -2); // Remove 'Id' suffix
      return toPascalCase(referenceName);
    }

    return undefined;
  };

  // Get the options from the reference
  const referenceOptions = reference?.options || [];

  // Handle the onChange event based on whether this is a single or multi-select field
  const handleChange = (newValue: string | string[]) => {
    if (multiple) {
      // For multi-select fields, ensure we always return an array
      if (Array.isArray(newValue)) {
        onChange(newValue);
      } else if (newValue === "") {
        // Empty string means no selection, so pass empty array
        onChange([]);
      } else {
        // Single string value, convert to array with one item
        onChange([newValue]);
      }
    } else {
      // For single-select fields, ensure we always return a string
      if (Array.isArray(newValue)) {
        onChange(newValue.length > 0 ? newValue[0] : "");
      } else {
        onChange(newValue);
      }
    }
  };

  // If no reference options are provided, fall back to a disabled field
  if (!reference || referenceOptions.length === 0) {
    return (
      <ObjectSelector
        multiple={multiple}
        disabled={true}
        error={error}
        errorMessage={errorMessage || "No options available"}
        id={id}
        label={getLabel()}
        name={name}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        value={value}
        options={[]}
        data-testid={
          dataTestId || `${multiple ? "ChildrenField" : "ParentField"}`
        }
        objectType={objectType}
        objectId={objectId !== undefined ? objectId : contextObjectId}
      />
    );
  }

  // Get the foreign field to display and use as value
  const idField = customIdField || reference.foreignField || "_id";
  const displayField = customDisplayField || "name"; // Assuming all referenced objects have a name field

  return (
    <ObjectSelector
      multiple={multiple}
      disabled={disabled}
      error={error}
      errorMessage={errorMessage}
      id={id}
      label={getLabel()}
      name={name}
      onChange={handleChange}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      value={value}
      options={referenceOptions}
      idField={idField}
      displayField={displayField}
      data-testid={
        dataTestId || `${multiple ? "ChildrenField" : "ParentField"}`
      }
      data-field-name={name}
      objectType={objectType}
      objectId={objectId !== undefined ? objectId : contextObjectId}
    />
  );
}

export default ReferenceField;

/**
 * Creates a component detector for reference fields
 * This can be used by both FormWithReferences and ObjectFieldset
 *
 * @param schema The schema for the form or object
 * @param objectType The type of object this form is for
 * @returns A component detector function compatible with AutoField.componentDetectorContext
 */
/**
 * Creates a component detector for reference fields
 * This can be used by both FormWithReferences and ObjectFieldset
 *
 * @param schema The schema for the form or object
 * @param objectType The type of object this form is for
 * @returns A component detector function compatible with AutoField.componentDetectorContext
 */
export function createReferenceFieldsComponentDetector(
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>,
  objectType: string
) {
  // Check if schema is a ZodReferencesBridge
  const isZodReferencesBridge = schema instanceof ZodReferencesBridge;

  // Use the same type signature as AutoField.defaultComponentDetector
  return (props: any, uniforms: any) => {
    const fieldName = props.name;

    // 1. First check if the field has a reference in its uniforms metadata
    if (props.field?.uniforms?.component === BELONGS_TO_FIELD) {
      return (fieldProps: any) => (
        <BelongsToField
          {...fieldProps}
          reference={props.field?.reference}
          objectType={objectType}
          schema={schema}
        />
      );
    }

    if (props.field?.uniforms?.component === HAS_MANY_FIELD) {
      return (fieldProps: any) => (
        <HasManyField
          {...fieldProps}
          reference={props.field?.reference}
          objectType={objectType}
          schema={schema}
        />
      );
    }

    // 2. For ZodReferencesBridge, try to get field info directly
    if (isZodReferencesBridge) {
      try {
        // Use type assertion to access getField
        const bridgeSchema = schema as ZodReferencesBridge<any>;
        const fieldInfo = bridgeSchema.getField(fieldName);

        // Check if the field has reference metadata and component info
        if (fieldInfo?.reference && fieldInfo?.uniforms?.component) {
          const referenceType = fieldInfo.uniforms.component;

          if (referenceType === BELONGS_TO_FIELD) {
            return (fieldProps: any) => (
              <BelongsToField
                {...fieldProps}
                reference={fieldInfo.reference}
                objectType={objectType}
                schema={schema}
              />
            );
          } else if (referenceType === HAS_MANY_FIELD) {
            return (fieldProps: any) => (
              <HasManyField
                {...fieldProps}
                reference={fieldInfo.reference}
                objectType={objectType}
                schema={schema}
              />
            );
          }
        }
      } catch (e) {
        // Silently continue to the next detection method
      }
    }

    // 3. If we have a getReferences method, try to use it as a fallback
    if (
      "getReferences" in schema &&
      typeof schema.getReferences === "function"
    ) {
      try {
        // Use type assertion
        const schemaWithReferences = schema as unknown as {
          getReferences(): Record<string, any>;
        };
        const references = schemaWithReferences.getReferences();

        if (references && references[fieldName]) {
          // Determine the reference type based on the relationship type
          // Use constants for consistency
          const referenceType =
            references[fieldName].type === RelationshipType.HAS_MANY ||
            references[fieldName].type === "HAS_MANY"
              ? HAS_MANY_FIELD
              : BELONGS_TO_FIELD;

          if (referenceType === BELONGS_TO_FIELD) {
            return (fieldProps: any) => (
              <BelongsToField
                {...fieldProps}
                reference={references[fieldName]}
                objectType={objectType}
                schema={schema}
              />
            );
          } else {
            return (fieldProps: any) => (
              <HasManyField
                {...fieldProps}
                reference={references[fieldName]}
                objectType={objectType}
                schema={schema}
              />
            );
          }
        }
      } catch (e) {
        // Silently continue to the default detector
      }
    }

    // 4. Fall back to the default component detector
    return AutoField.defaultComponentDetector(props, uniforms);
  };
}
