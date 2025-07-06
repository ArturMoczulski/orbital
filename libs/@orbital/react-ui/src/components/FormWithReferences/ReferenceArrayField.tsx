import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import { ReferenceMetadata } from "@orbital/core/src/zod/reference/reference";
import { connectField } from "uniforms";

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
  // If no reference options are provided, return a message
  if (!reference || !reference.options || reference.options.length === 0) {
    return (
      <FormControl fullWidth error={error} margin="dense">
        <InputLabel>{label}</InputLabel>
        <OutlinedInput
          disabled
          label={label}
          data-testid={`${objectType}ReferenceArrayField`}
          data-field-name={name}
        />
        <FormHelperText>
          {errorMessage || "No options available"}
        </FormHelperText>
      </FormControl>
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name"; // Assuming all referenced objects have a name field

  return (
    <FormControl fullWidth error={error} margin="dense">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        multiple
        value={value}
        onChange={(event) => {
          const value = event.target.value;
          onChange(typeof value === "string" ? value.split(",") : value);
        }}
        input={
          <OutlinedInput
            label={label}
            data-testid={`${objectType}ReferenceArrayField`}
            data-field-name={name}
          />
        }
        renderValue={(selected) => {
          // Display selected items by name
          return selected
            .map((id) => {
              const option = reference.options.find(
                (opt) => opt[foreignField] === id
              );
              return option ? option[displayField] || id : id;
            })
            .join(", ");
        }}
        disabled={disabled || readOnly}
        required={required}
      >
        {reference.options.map((option) => (
          <MenuItem
            key={option[foreignField]}
            value={option[foreignField]}
            data-testid={`${objectType}ReferenceArrayField-item`}
            data-object-id={option[foreignField]}
            data-field-name={name}
          >
            <Checkbox checked={value.indexOf(option[foreignField]) > -1} />
            <ListItemText
              primary={option[displayField] || option[foreignField]}
            />
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
}

export default connectField(ReferenceArrayField);
