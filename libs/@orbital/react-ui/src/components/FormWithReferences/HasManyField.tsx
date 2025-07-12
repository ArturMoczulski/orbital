import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import React from "react";
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
  // Get object data from context if available
  const [contextValue, setContextValue] = React.useState<string[] | undefined>(
    undefined
  );

  // Initialize local state with the provided value
  const [localValue, setLocalValue] = React.useState<string[]>(value);

  // Try to get data from ObjectDataContext
  try {
    const { getObjectData } = useObjectData();
    const mainData = getObjectData("main");

    // Use effect to update the value when Redux state changes
    React.useEffect(() => {
      if (mainData && mainData.data && name in mainData.data) {
        const dataValue = mainData.data[name];
        if (Array.isArray(dataValue)) {
          setContextValue(dataValue);
          setLocalValue(dataValue); // Update local state when Redux changes
        }
      }
    }, [mainData, name]);

    // Force re-render when Redux state changes
    React.useEffect(() => {
      // This empty dependency array ensures we're not causing infinite re-renders
      // but the effect itself will be re-run whenever the component re-renders
      // due to parent updates, which happens when Redux state changes
      if (contextValue !== undefined) {
        setLocalValue(contextValue);
      }
    }, [contextValue]);

    // Add a direct effect to update when the value prop changes
    // This is important for the test case where we manually dispatch an action
    React.useEffect(() => {
      if (value && value.length > 0) {
        setLocalValue(value);
      }
    }, [value]);
  } catch (error) {
    // Context not available, will use props only
  }

  // Use context value if available, otherwise fall back to local value
  const finalValue = contextValue !== undefined ? contextValue : localValue;

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

    // Update local state immediately for responsive UI
    setLocalValue(processedValue);

    // Call the original onChange to update Redux
    onChange(processedValue);
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
