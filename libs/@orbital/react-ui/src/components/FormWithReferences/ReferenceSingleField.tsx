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
  objectType, // Required prop, no default value
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
        data-testid={`${objectType}ReferenceSingleField ReferenceSingleField`}
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  // Use the provided objectType, not the reference name
  // objectType is already defined in the function parameters with default "Area"

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
      data-testid={`${objectType}ReferenceSingleField ReferenceSingleField`}
      // Use MenuProps to add a custom class that can be used for selection
      SelectProps={{
        MenuProps: {
          className: `${objectType}-reference-field-${name}`,
          // Use PaperProps to add data attributes to the dropdown container
          PaperProps: {
            "data-testid": `${objectType}ReferenceSingleField-dropdown`,
          } as any,
        },
      }}
    >
      {/* Add an empty option if not required */}
      {!required && (
        <MenuItem
          value=""
          data-testid={`${objectType}ReferenceSingleField-none`}
          data-field-name={name}
        >
          <em>None</em>
        </MenuItem>
      )}

      {/* Map reference options to menu items */}
      {reference.options.map((option) => (
        <MenuItem
          key={option[foreignField]}
          value={option[foreignField]}
          // Add data attributes to each menu item for better identification
          data-testid={`${objectType}ReferenceSingleField-item`}
          data-object-id={option[foreignField]}
          data-field-name={name}
        >
          {option[displayField] || option[foreignField]}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default connectField(ReferenceSingleField);
