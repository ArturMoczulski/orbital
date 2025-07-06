import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { camelCase, startCase } from "lodash";
import { connectField } from "uniforms";
import ObjectSelector from "../ObjectSelector";

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
  objectType: string; // Required prop to specify the containing object type
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
  objectType, // Required prop, no default value
}: HasManyFieldProps) {
  const toPascalCase = (str: string): string =>
    startCase(camelCase(str)).replace(/\s/g, "");

  // Helper to get a proper label from field name or reference
  const getLabel = (): string | undefined => {
    // Use provided label if available
    if (label) return label;

    // Use reference name if available
    if (reference?.name) return toPascalCase(reference.name);

    // Extract reference name from field name (e.g., "tagIds" -> "Tags")
    if (name.endsWith("Ids")) {
      const referenceName = name.slice(0, -3); // Remove 'Ids' suffix
      return toPascalCase(referenceName);
    }

    return undefined;
  };

  // If no reference options are provided, fall back to a disabled field
  if (!reference || !reference.options || reference.options.length === 0) {
    return (
      <ObjectSelector
        multiple={true}
        disabled={true}
        error={error}
        errorMessage={errorMessage || "No options available"}
        id={id}
        label={getLabel()}
        name={name}
        onChange={(value) => {
          if (Array.isArray(value)) {
            onChange(value);
          } else {
            onChange([]);
          }
        }}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        value={value}
        options={[]}
        data-testid={`${objectType}HasManyField`}
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  return (
    <ObjectSelector
      multiple={true}
      disabled={disabled}
      error={error}
      errorMessage={errorMessage}
      id={id}
      label={getLabel()}
      name={name}
      onChange={(value) => {
        // Since this is a HasManyField, we always expect an array
        // But ObjectSelector can return string | string[], so we need to handle both
        if (Array.isArray(value)) {
          onChange(value);
        } else if (value === "") {
          // Empty string means no selection, so pass empty array
          onChange([]);
        } else {
          // Single string value, convert to array with one item
          onChange([value]);
        }
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      value={value}
      options={reference.options}
      idField={foreignField}
      displayField={displayField}
      data-testid={`${objectType}HasManyField`}
    />
  );
}

export default connectField(HasManyField);
