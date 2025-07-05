import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";

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
  reference?: ReferenceMetadata & {
    options: any[];
  };
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
}: ReferenceSingleFieldProps) {
  // If no reference options are provided, fall back to a standard text field
  if (!reference || !reference.options || reference.options.length === 0) {
    return (
      <TextField
        disabled={disabled}
        error={error}
        fullWidth
        helperText={errorMessage}
        id={id}
        label={label}
        margin="dense"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value ?? ""}
        variant="outlined"
        data-testid="ReferenceSingleField"
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  return (
    <TextField
      disabled={disabled || readOnly}
      error={error}
      fullWidth
      helperText={errorMessage}
      id={id}
      label={label}
      margin="dense"
      name={name}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      select
      value={value ?? ""}
      variant="outlined"
      data-testid="ReferenceSingleField"
    >
      {/* Add an empty option if not required */}
      {!required && (
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
      )}

      {/* Map reference options to menu items */}
      {reference.options.map((option) => (
        <MenuItem key={option[foreignField]} value={option[foreignField]}>
          {option[displayField] || option[foreignField]}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default connectField(ReferenceSingleField);
