import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import ChildrenField from "./ChildrenField";
import { useObjectSchema } from "./ObjectSchemaContext";
import ParentField from "./ParentField";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

export type RecursiveRelationshipFieldProps = {
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
  reference?: ReferenceMetadata & {
    options: any[];
  };
  objectType?: string; // Optional, can be inferred from schema or context
  schema?: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>; // Optional, can be provided via context
  multiple?: boolean; // Whether this is a one-to-many or one-to-one recursive relationship
};

/**
 * RecursiveRelationshipField is a wrapper component that delegates to either
 * ParentField (for single selection) or ChildrenField (for multiple selection)
 * based on the multiple prop.
 */
function RecursiveRelationshipField({
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
  objectType: providedObjectType,
  schema: propSchema,
  multiple = false, // Default to single selection (one-to-one)
}: RecursiveRelationshipFieldProps) {
  // Try to get schema and objectType from context if not provided as props
  let contextSchema;
  let contextObjectType;

  try {
    const context = useObjectSchema();
    contextSchema = context.schema;
    contextObjectType = context.objectType;
  } catch (error) {
    // Context not available, will use props only
  }

  // Use provided schema or get from context
  const schema = propSchema || contextSchema;

  // Use provided objectType, or get from context
  const finalObjectType = providedObjectType || contextObjectType;

  if (!finalObjectType) {
    throw new Error(
      "RecursiveRelationshipField requires an objectType prop or to be within an ObjectSchemaProvider"
    );
  }
  // Determine the current ID to filter out from options (to prevent self-reference)
  const currentId = multiple
    ? undefined // For multiple selection, we'll pass this to ChildrenField
    : typeof value === "string"
      ? value
      : "";

  // For multiple selection, use ChildrenField
  if (multiple) {
    // Ensure value is an array for ChildrenField
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];

    return (
      <ChildrenField
        disabled={disabled}
        error={error}
        errorMessage={errorMessage}
        id={id}
        label={label}
        name={name}
        onChange={onChange as any} // Type assertion to bypass TypeScript error
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        value={arrayValue}
        reference={reference}
        objectType={finalObjectType}
        schema={schema}
        currentId={currentId}
        data-testid="RecursiveRelationshipField"
      />
    );
  }

  // For single selection, use ParentField
  return (
    <ParentField
      disabled={disabled}
      error={error}
      errorMessage={errorMessage}
      id={id}
      label={label}
      name={name}
      onChange={onChange as any} // Type assertion to bypass TypeScript error
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      value={typeof value === "string" ? value : ""}
      reference={reference}
      objectType={finalObjectType}
      schema={schema}
      data-testid="RecursiveRelationshipField"
    />
  );
}

export default connectField(RecursiveRelationshipField);
