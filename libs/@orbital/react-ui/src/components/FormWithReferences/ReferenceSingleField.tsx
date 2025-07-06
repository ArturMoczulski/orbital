import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { camelCase, startCase } from "lodash";
import { connectField } from "uniforms";
import ObjectSelector from "../ObjectSelector/ObjectSelector";

export type ReferenceSingleFieldProps = {
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
  reference: ReferenceMetadata & {
    options: any[];
  };
  objectType: string; // Required prop to specify the containing object type
};

function ReferenceSingleField({
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
}: ReferenceSingleFieldProps) {
  const toPascalCase = (str: string): string =>
    startCase(camelCase(str)).replace(/\s/g, "");

  // Helper to get a proper label from field name or reference
  const getLabel = (): string | undefined => {
    // Use provided label if available
    if (label) return label;

    // Use reference name if available
    if (reference?.name) return toPascalCase(reference.name);

    // Extract reference name from field name (e.g., "worldId" -> "World")
    if (name.endsWith("Id")) {
      const referenceName = name.slice(0, -2); // Remove 'Id' suffix
      return toPascalCase(referenceName);
    }

    return undefined;
  };

  // If no reference options are provided, fall back to a standard text field
  if (!reference || !reference.options || reference.options.length === 0) {
    return (
      <ObjectSelector
        disabled={disabled}
        error={error}
        errorMessage={errorMessage}
        id={id}
        label={getLabel()}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        value={value}
        options={[]}
        objectType={objectType}
        componentName="ReferenceSingleField"
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  return (
    <ObjectSelector
      disabled={disabled}
      error={error}
      errorMessage={errorMessage}
      id={id}
      label={getLabel()}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      value={value}
      options={reference.options}
      objectType={objectType}
      idField={foreignField}
      displayField={displayField}
      componentName="ReferenceSingleField"
    />
  );
}

export default connectField(ReferenceSingleField);
