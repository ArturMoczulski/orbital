import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";
import MultiObjectSelector from "../../components/ObjectSelector/MultiObjectSelector";

export type ReferenceArrayFieldProps = {
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

function ReferenceArrayField({
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
}: ReferenceArrayFieldProps) {
  // Get the foreign field to display and use as value
  const foreignField = reference?.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  return (
    <MultiObjectSelector
      disabled={disabled}
      error={error}
      errorMessage={errorMessage}
      id={id}
      label={label}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      value={value}
      options={reference?.options || []}
      idField={foreignField}
      displayField={displayField}
      data-testid={`${objectType}ReferenceArrayField`}
    />
  );
}

export default connectField(ReferenceArrayField);
