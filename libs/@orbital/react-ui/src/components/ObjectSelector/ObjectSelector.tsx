import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

export type ObjectSelectorProps = {
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
  options: any[];
  objectType: string; // Required prop to specify the containing object type
  idField?: string; // Field to use as the ID/value (default: "_id")
  displayField?: string; // Field to display (default: "name")
  componentName?: string; // The name of the parent component (e.g., "ReferenceSingleField")
};

/**
 * ObjectSelector component allows selecting an object from a list of options
 * This is a generic component that can be used for any type of object selection
 */
export function ObjectSelector({
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
  options,
  objectType,
  idField = "_id",
  displayField = "name",
  componentName = "ObjectSelector",
}: ObjectSelectorProps) {
  // Generate the data-testid based on objectType and componentName
  const dataTestId = `${objectType}${componentName} ${componentName}`;
  // If no options are provided, fall back to a standard text field
  if (!options || options.length === 0) {
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
        data-testid={dataTestId}
        data-field-name={name}
      />
    );
  }

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
      data-testid={dataTestId}
      data-field-name={name}
      // Use MenuProps to add a custom class that can be used for selection
      SelectProps={{
        MenuProps: {
          className: `${objectType}-object-selector-${name}`,
          // Use PaperProps to add data attributes to the dropdown container
          PaperProps: {
            "data-testid": `${objectType}${componentName}-dropdown`,
            "data-component-name": componentName,
            "data-object-type": objectType,
          } as any,
        },
      }}
    >
      {/* Add an empty option if not required */}
      {!required && (
        <MenuItem
          value=""
          data-testid={`${objectType}${componentName}-none`}
          data-field-name={name}
        >
          <em>None</em>
        </MenuItem>
      )}

      {/* Map options to menu items */}
      {options.map((option) => (
        <MenuItem
          key={option[idField]}
          value={option[idField]}
          // Add data attributes to each menu item for better identification
          data-testid={`${objectType}${componentName}-item`}
          data-object-id={option[idField]}
          data-field-name={name}
        >
          {option[displayField] || option[idField]}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default ObjectSelector;
