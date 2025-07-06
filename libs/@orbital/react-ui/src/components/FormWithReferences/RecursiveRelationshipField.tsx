import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import ChildrenField from "./ChildrenField";
import ParentField from "./ParentField";

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
  objectType: string; // Required prop to specify the containing object type
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
  objectType,
  multiple = false, // Default to single selection (one-to-one)
}: RecursiveRelationshipFieldProps) {
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
        objectType={objectType}
        currentId={currentId}
        data-testid={`${objectType}RecursiveRelationshipField`}
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
      objectType={objectType}
      data-testid={`${objectType}RecursiveRelationshipField`}
    />
  );
}

export default connectField(RecursiveRelationshipField);
