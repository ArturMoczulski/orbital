import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { camelCase, startCase } from "lodash";
import { connectField } from "uniforms";
import ObjectSelector from "../ObjectSelector";

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
  objectType: string; // Required prop to specify the containing object type
  "data-testid"?: string; // Allow passing a custom testid
};

/**
 * ParentField is a specialized component for handling parent relationships in recursive structures.
 * It's used for fields like "parentId" that reference a single parent node.
 *
 * This component directly uses ObjectSelector and adds filtering to prevent self-reference.
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
  "data-testid": dataTestId,
}: ParentFieldProps) {
  // Filter out the current item from options to prevent self-reference
  // This is important for recursive relationships to avoid circular references
  const currentId = value;

  // Create a modified reference with filtered options
  const filteredReference = reference && {
    ...reference,
    options:
      currentId && reference.options
        ? reference.options.filter((option) => option._id !== currentId)
        : reference?.options || [],
  };

  const toPascalCase = (str: string): string =>
    startCase(camelCase(str)).replace(/\s/g, "");

  // Helper to get a proper label from field name or reference
  const getLabel = (): string | undefined => {
    // Use provided label if available
    if (label) return label;

    // Use reference name if available
    if (filteredReference?.name) return toPascalCase(filteredReference.name);

    // Extract reference name from field name (e.g., "worldId" -> "World")
    if (name.endsWith("Id")) {
      const referenceName = name.slice(0, -2); // Remove 'Id' suffix
      return toPascalCase(referenceName);
    }

    return undefined;
  };

  // Handle the onChange event to ensure we always return a string
  const handleChange = (newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      onChange(newValue.length > 0 ? newValue[0] : "");
    } else {
      onChange(newValue);
    }
  };

  // If no reference options are provided, fall back to a disabled field
  if (
    !filteredReference ||
    !filteredReference.options ||
    filteredReference.options.length === 0
  ) {
    return (
      <ObjectSelector
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
        data-testid={dataTestId || `${objectType}ParentField`}
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = filteredReference.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  return (
    <ObjectSelector
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
      options={filteredReference.options}
      idField={foreignField}
      displayField={displayField}
      data-testid={dataTestId || `${objectType}ParentField`}
    />
  );
}

export default connectField(ParentField);
