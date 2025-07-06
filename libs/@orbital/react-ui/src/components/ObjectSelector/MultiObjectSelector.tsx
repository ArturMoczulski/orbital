import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";

export type MultiObjectSelectorProps = {
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
  options: any[];
  idField?: string; // Field to use as the ID/value (default: "_id")
  displayField?: string; // Field to display (default: "name")
  className?: string; // Optional class name for styling
  "data-testid"?: string; // Optional data-testid for testing
};

/**
 * MultiObjectSelector component allows selecting multiple objects from a list of options
 * This is a generic component that can be used for any type of multi-object selection
 */
export function MultiObjectSelector({
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
  options,
  idField = "_id",
  displayField = "name",
  className,
  "data-testid": dataTestId = "MultiObjectSelector",
}: MultiObjectSelectorProps) {
  // If no options are provided, return a disabled field with a message
  if (!options || options.length === 0) {
    return (
      <FormControl fullWidth error={error} margin="dense">
        <InputLabel>{label}</InputLabel>
        <OutlinedInput
          disabled
          label={label}
          data-testid={dataTestId}
          data-field-name={name}
        />
        <FormHelperText>
          {errorMessage || "No options available"}
        </FormHelperText>
      </FormControl>
    );
  }

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
            data-testid={dataTestId}
            data-field-name={name}
          />
        }
        renderValue={(selected) => {
          // Display selected items by name
          return selected
            .map((id) => {
              const option = options.find((opt) => opt[idField] === id);
              return option ? option[displayField] || id : id;
            })
            .join(", ");
        }}
        disabled={disabled || readOnly}
        required={required}
        // Use MenuProps to add a custom class that can be used for selection
        MenuProps={{
          className: `multi-object-selector-${name} ${className || ""}`,
          // Use PaperProps to add data attributes to the dropdown container
          PaperProps: {
            "data-testid": `${dataTestId}-dropdown`,
          } as any,
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option[idField]}
            value={option[idField]}
            data-testid={`${dataTestId}-item`}
            data-value-id={option[idField]}
            data-field-name={name}
          >
            <Checkbox checked={value.indexOf(option[idField]) > -1} />
            <ListItemText primary={option[displayField] || option[idField]} />
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
}

export default MultiObjectSelector;
