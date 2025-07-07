import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { camelCase, startCase } from "lodash";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { useObject } from "./ObjectProvider";
import { useObjectSchema } from "./ObjectSchemaContext";
import {
  inferObjectTypeFromSchema,
  ZodReferencesBridge,
} from "./ZodReferencesBridge";

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
      <></>
      //   <ObjectSelector
      //     multiple={multiple}
      //     disabled={true}
      //     error={error}
      //     errorMessage={errorMessage || "No options available"}
      //     id={id}
      //     label={getLabel()}
      //     name={name}
      //     onChange={handleChange}
      //     placeholder={placeholder}
      //     readOnly={readOnly}
      //     required={required}
      //     value={value}
      //     options={[]}
      //     data-testid={
      //       dataTestId || `${multiple ? "ChildrenField" : "ParentField"}`
      //     }
      //     objectType={objectType}
      //     objectId={objectId !== undefined ? objectId : contextObjectId}
      //   />
    );
  }

  // Get the foreign field to display and use as value
  const idField = customIdField || reference.foreignField || "_id";
  const displayField = customDisplayField || "name"; // Assuming all referenced objects have a name field

  return (
    <></>
    // <ObjectSelector
    //   multiple={multiple}
    //   disabled={disabled}
    //   error={error}
    //   errorMessage={errorMessage}
    //   id={id}
    //   label={getLabel()}
    //   name={name}
    //   onChange={handleChange}
    //   placeholder={placeholder}
    //   readOnly={readOnly}
    //   required={required}
    //   value={value}
    //   options={referenceOptions}
    //   idField={idField}
    //   displayField={displayField}
    //   data-testid={
    //     dataTestId || `${multiple ? "ChildrenField" : "ParentField"}`
    //   }
    //   objectType={objectType}
    //   objectId={objectId !== undefined ? objectId : contextObjectId}
    // />
  );
}

export default ReferenceField;
