import Box from "@mui/material/Box";
import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { useObjectData } from "./ObjectDataContext";
import { useObjectSchema } from "./ObjectSchemaContext";
import ReferenceField from "./ReferenceField";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

export type BelongsToFieldProps = {
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
  schema?: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>; // Optional, can be provided via context
  objectId?: string; // Optional, used to identify the component in tests
};

function BelongsToField({
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
  value = "",
  reference,
  objectType,
  schema: propSchema,
  objectId,
}: BelongsToFieldProps) {
  // Get data from ObjectDataContext if available
  let contextData: string | undefined;
  let updateContextData:
    | ((data: Record<string, any>, merge?: boolean) => void)
    | undefined;

  try {
    const { getObjectData, updateObjectData } = useObjectData();
    const mainData = getObjectData("main");

    // Get the field value from context data if available
    if (mainData && mainData.data && name in mainData.data) {
      const dataValue = mainData.data[name];
      if (typeof dataValue === "string") {
        contextData = dataValue;
      }
    }

    // Store the update function for later use
    updateContextData = (data: Record<string, any>, merge = true) => {
      updateObjectData("main", data, merge);
    };
  } catch (error) {
    console.log(`[BelongsToField] Context not available:`, error);
    // Context not available, will use props only
  }

  // Use context data if available, otherwise fall back to prop value
  // This ensures we're always using the most up-to-date value
  const finalValue = contextData !== undefined ? contextData : value;

  // Create a wrapper for onChange that can handle both string and string[] values
  // but will only pass string values to the original onChange function
  const handleChange = (newValue: string | string[] | null) => {
    let processedValue: string = "";

    // If newValue is null or empty string and we have a finalValue,
    // this is likely a blur event and we should keep the current value
    if ((newValue === null || newValue === "") && finalValue) {
      // Keep the current value
      processedValue = finalValue;

      // No need to call onChange or updateContextData since we're not changing anything
      return;
    } else if (Array.isArray(newValue)) {
      processedValue = newValue.length > 0 ? newValue[0] : "";
    } else {
      processedValue = newValue || "";
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
    <Box sx={{ pt: 2, pb: 2 }}>
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
        // Add a key prop to force re-render when finalValue changes
        key={`belongsto-${name}-${finalValue}`}
        reference={reference}
        objectType={finalObjectType}
        schema={schema}
        multiple={false}
        idField="id" // Explicitly set idField to match the structure of our options
        data-testid="BelongsToField"
        objectId={objectId}
      />
    </Box>
  );
}

export default connectField(BelongsToField, {
  kind: "leaf",
  initialValue: false,
});
