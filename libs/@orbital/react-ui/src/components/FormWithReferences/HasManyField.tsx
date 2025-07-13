import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { useObjectData } from "./ObjectDataContext";
import { useObjectSchema } from "./ObjectSchemaContext";
import ReferenceField from "./ReferenceField";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

export type HasManyFieldProps = {
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
  objectId?: string; // Unique identifier for the parent object
};

function HasManyField({
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
  objectId,
}: HasManyFieldProps) {
  // Get data from ObjectDataContext if available
  // Get data from ObjectDataContext if available
  let contextData: string[] | undefined;
  let updateContextData:
    | ((data: Record<string, any>, merge?: boolean) => void)
    | undefined;

  try {
    const { getObjectData, updateObjectData } = useObjectData();
    const mainData = getObjectData("main");

    // Get the field value from context data if available
    if (mainData && mainData.data && name in mainData.data) {
      const dataValue = mainData.data[name];
      if (Array.isArray(dataValue)) {
        contextData = dataValue;
      }
    }

    // Store the update function for later use
    updateContextData = (data: Record<string, any>, merge = true) => {
      updateObjectData("main", data, merge);
    };
  } catch (error) {
    // Context not available, will use props only
  }

  // Use context data if available, otherwise fall back to prop value
  // This ensures we're always using the most up-to-date value
  const finalValue = contextData !== undefined ? contextData : value;

  // Create a wrapper for onChange that can handle both string and string[] values
  // but will only pass string[] values to the original onChange function
  const handleChange = (newValue: string | string[]) => {
    let processedValue: string[] = [];

    if (Array.isArray(newValue)) {
      processedValue = newValue;
    } else if (newValue === "") {
      // Empty string means no selection, so pass empty array
      processedValue = [];
    } else {
      // Single string value, convert to array with one item
      processedValue = [newValue];
    }

    // Call the original onChange to update parent component state
    onChange(processedValue);

    // Update context data if available
    if (updateContextData) {
      updateContextData({ [name]: processedValue });
    }
  };

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
      value={finalValue}
      reference={reference}
      objectType={finalObjectType}
      schema={schema}
      multiple={true}
      data-testid="HasManyField"
      objectId={objectId}
    />
  );
}

export default connectField(HasManyField);
