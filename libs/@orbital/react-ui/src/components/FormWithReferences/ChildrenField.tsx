import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { useObjectSchema } from "./ObjectSchemaContext";
import ReferenceField from "./ReferenceField";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

export type ChildrenFieldProps = {
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  id: string;
  label?: string;
  name: string;
  onChange: (value: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value?: string[];
  reference?: ReferenceMetadata & {
    options: any[];
  };
  objectType?: string; // Optional, can be inferred from schema or context
  schema?: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>; // Optional, can be provided via context
  currentId?: string; // ID of the current node to filter out from options
  "data-testid"?: string; // Allow passing a custom testid
};

/**
 * ChildrenField is a specialized component for handling children relationships in recursive structures.
 * It's used for fields like "childrenIds" that reference multiple child nodes.
 *
 * This component uses ReferenceField and adds filtering to prevent self-reference.
 */
function ChildrenField({
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
  value = [],
  reference,
  objectType,
  schema: propSchema,
  currentId, // ID of the current node to filter out from options
  "data-testid": dataTestId,
}: ChildrenFieldProps) {
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
  // but will only pass string[] values to the original onChange function
  const handleChange = (newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      onChange(newValue);
    } else if (newValue === "") {
      // Empty string means no selection, so pass empty array
      onChange([]);
    } else {
      // Single string value, convert to array with one item
      onChange([newValue]);
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
      schema={schema}
      currentId={currentId} // Filter out the current item to prevent self-reference
      multiple={true}
      data-testid={dataTestId || "ChildrenField"}
    />
  );
}

export default connectField(ChildrenField);
