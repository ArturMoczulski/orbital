import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { useObjectSchema } from "./ObjectSchemaContext";
import ReferenceField from "./ReferenceField";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

export type ParentFieldProps = {
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  id: string;
  label?: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value?: string;
  reference?: ReferenceMetadata & {
    options: any[];
  };
  objectType?: string; // Optional, can be inferred from schema or context
  objectId?: string; // Optional object ID for data-object-id attribute
  schema?: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>; // Optional, can be provided via context
  "data-testid"?: string; // Allow passing a custom testid
};

/**
 * ParentField is a specialized component for handling parent relationships in recursive structures.
 * It's used for fields like "parentId" that reference a single parent node.
 *
 * This component uses ReferenceField and adds filtering to prevent self-reference.
 */
function ParentField({
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
  objectType,
  objectId,
  schema: propSchema,
  "data-testid": dataTestId,
}: ParentFieldProps) {
  // Try to get schema and objectType from context if not provided as prop
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
  // Use provided objectType or get from context
  const finalObjectType = objectType || contextObjectType;
  // Create a wrapper for onChange that can handle both string and string[] values
  // but will only pass string values to the original onChange function
  const handleChange = (newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      onChange(newValue.length > 0 ? newValue[0] : "");
    } else {
      onChange(newValue);
    }
  };

  return (
    <ReferenceField
      disabled={disabled}
      error={error}
      errorMessage={errorMessage}
      id={id}
      label={label}
      name={name}
      onChange={handleChange}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      value={value}
      reference={reference}
      objectType={finalObjectType}
      objectId={objectId}
      schema={schema}
      currentId={value} // Filter out the current item to prevent self-reference
      multiple={false}
      data-testid={dataTestId || "ParentField"}
    />
  );
}

export default connectField(ParentField);
