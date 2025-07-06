import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";

export type ObjectSelectorProps = {
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
  options: any[];
  idField?: string; // Field to use as the ID/value (default: "_id")
  displayField?: string; // Field to display (default: "name")
  componentName?: string; // The name of the parent component (e.g., "ReferenceSingleField")
  className?: string; // Optional class name for styling
  "data-testid"?: string; // Optional data-testid for testing
  objectType?: string; // Optional object type for data-object-type attribute
  objectId?: string; // Optional object ID for data-object-id attribute
  multiple?: boolean; // Whether to allow multiple selections
};

/**
 * ObjectSelector component allows selecting one or multiple objects from a list of options
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
  idField = "_id",
  displayField = "name",
  componentName = "ObjectSelector",
  className,
  "data-testid": dataTestId,
  objectType,
  objectId,
  multiple = false,
}: ObjectSelectorProps) {
  // Generate the data-testid based on componentName or provided dataTestId
  const testId = dataTestId || componentName;

  // Normalize value to handle both single and multiple modes
  const normalizedValue = multiple
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : Array.isArray(value)
      ? value[0] || ""
      : value || "";

  // If no options are provided, handle empty state
  if (!options || options.length === 0) {
    if (multiple) {
      // For multiple mode, show a disabled field with a message (like MultiObjectSelector)
      return (
        <FormControl
          fullWidth
          error={error}
          margin="dense"
          data-object-type={objectType}
          {...(objectId !== undefined && {
            "data-object-id": objectId,
          })}
        >
          <InputLabel>{label}</InputLabel>
          <OutlinedInput
            disabled
            label={label}
            data-testid={testId}
            data-field-name={name}
          />
          <FormHelperText>
            {errorMessage || "No options available"}
          </FormHelperText>
        </FormControl>
      );
    } else {
      // For single mode, fall back to a standard text field (like original ObjectSelector)
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
          value={normalizedValue}
          variant="outlined"
          data-testid={testId}
          data-field-name={name}
          data-object-type={objectType}
          {...(objectId !== undefined && {
            "data-object-id": objectId,
          })}
        />
      );
    }
  }

  // For multiple selection mode
  if (multiple) {
    // In multiple mode, we don't need to filter out the selected values
    const displayOptions = options;

    return (
      <FormControl
        fullWidth
        error={error}
        margin="dense"
        data-object-type={objectType}
        {...(objectId !== undefined && { "data-object-id": objectId })}
      >
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          multiple
          value={normalizedValue as string[]}
          onChange={(event) => {
            const value = event.target.value;
            onChange(typeof value === "string" ? value.split(",") : value);
          }}
          input={
            <OutlinedInput
              label={label}
              data-testid={testId}
              data-field-name={name}
              data-object-type={objectType}
              {...(objectId !== undefined && { "data-object-id": objectId })}
            />
          }
          renderValue={(selected) => {
            // Display selected items by name - use full options list for display
            return (selected as string[])
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
            className: `object-selector-${name} ${className || ""}`,
            // Use PaperProps to add data attributes to the dropdown container
            PaperProps: {
              "data-testid": `${testId}-dropdown`,
              "data-component-name": componentName,
            } as any,
          }}
        >
          {displayOptions.map((option) => (
            <MenuItem
              key={option[idField]}
              value={option[idField]}
              data-testid={`${testId}-item`}
              data-value-id={option[idField]}
              data-field-name={name}
              data-object-id={objectId} // ID of the parent object containing the field
            >
              <Checkbox
                checked={
                  (normalizedValue as string[]).indexOf(option[idField]) > -1
                }
              />
              <ListItemText primary={option[displayField] || option[idField]} />
            </MenuItem>
          ))}
        </Select>
        {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
      </FormControl>
    );
  }

  // For single selection mode
  // Filter out the currently selected value from dropdown options
  // This prevents selecting the same value again and is useful for recursive relationships
  const displayOptions = normalizedValue
    ? options.filter((option) => option[idField] !== normalizedValue)
    : options;

  // Find the selected option from the full options list for display
  const selectedOption = normalizedValue
    ? options.find((option) => option[idField] === normalizedValue)
    : null;

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
      value={normalizedValue}
      variant="outlined"
      data-testid={testId}
      data-field-name={name}
      data-object-type={objectType}
      {...(objectId !== undefined && { "data-object-id": objectId })}
      // Use MenuProps to add a custom class that can be used for selection
      SelectProps={{
        // Use renderValue to explicitly set the display text for the selected value
        renderValue: (value) => {
          // If no value is selected, return empty string
          if (!value) return "";

          // Find the option with the matching value from the full options list
          const option = options.find((opt) => opt[idField] === value);

          // Return the display text if found, otherwise return the value itself
          return option ? option[displayField] || option[idField] : value;
        },
        MenuProps: {
          className: `object-selector-${name} ${className || ""}`,
          // Use PaperProps to add data attributes to the dropdown container
          PaperProps: {
            "data-testid": `${testId}-dropdown`,
            "data-component-name": componentName,
          } as any,
        },
      }}
    >
      {/* Add an empty option if not required */}
      {!required && (
        <MenuItem
          value=""
          data-testid={`${testId}-none`}
          data-field-name={name}
        >
          <em>None</em>
        </MenuItem>
      )}

      {/* Map options to menu items */}
      {displayOptions.map((option) => (
        <MenuItem
          key={option[idField]}
          value={option[idField]}
          // Add data attributes to each menu item for better identification
          data-testid={`${testId}-item`}
          data-value-id={option[idField]} // For option/value identification
          data-field-name={name}
          data-display-text={option[displayField] || option[idField]}
          data-object-id={objectId} // ID of the parent object containing the field
        >
          {option[displayField] || option[idField]}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default ObjectSelector;
