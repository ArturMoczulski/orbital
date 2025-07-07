import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { OptionsProviderState } from "./providers/OptionsProvider";

/**
 * Props interface for the MultiObjectSelectUI component
 */
export interface MultiObjectSelectUIProps {
  // Common props
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

  // Provider state
  providerState: OptionsProviderState;

  // Additional props
  className?: string;
  "data-testid"?: string;
  objectType?: string;
  objectId?: string;
}

/**
 * MultiObjectSelectUI component
 * Provides a multi-select UI with autocomplete functionality
 */
export function MultiObjectSelectUI({
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
  providerState,
  className,
  "data-testid": dataTestId,
  objectType,
  objectId,
}: MultiObjectSelectUIProps) {
  const { filteredOptions, isLoading, setSearchQuery, idField, displayField } =
    providerState;

  // Find the selected options from the filtered options
  const selectedOptions = value
    ? filteredOptions.filter((option) => value.includes(option[idField]))
    : [];

  // Generate the data-testid
  const testId = dataTestId || "MultiObjectSelectUI";

  return (
    <Autocomplete
      id={id}
      multiple
      value={selectedOptions}
      onChange={(_, newValue) => {
        onChange(newValue.map((item) => item[idField]));
      }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === "input") {
          setSearchQuery(newInputValue);
        }
      }}
      options={filteredOptions}
      getOptionLabel={(option) => {
        // Handle both string and object options
        if (typeof option === "string") return option;
        return option[displayField] || option[idField] || "";
      }}
      isOptionEqualToValue={(option, value) =>
        option[idField] === value[idField]
      }
      loading={isLoading}
      disabled={disabled || readOnly}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={errorMessage}
          required={required}
          fullWidth
          margin="dense"
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          data-testid={testId}
          data-field-name={name}
          data-object-type={objectType}
          {...(objectId !== undefined && { "data-object-id": objectId })}
        />
      )}
      renderOption={(props, option) => (
        <li
          {...props}
          data-testid={`${testId}-item`}
          data-value-id={option[idField]}
          data-field-name={name}
          data-display-text={option[displayField] || option[idField]}
          data-object-id={objectId}
        >
          {option[displayField] || option[idField] || ""}
        </li>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option[displayField] || option[idField] || ""}
            {...getTagProps({ index })}
            data-testid={`${testId}-tag`}
            data-value-id={option[idField]}
          />
        ))
      }
      className={className}
    />
  );
}

export default MultiObjectSelectUI;
