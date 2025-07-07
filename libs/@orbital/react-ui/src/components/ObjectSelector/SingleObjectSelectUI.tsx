import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { OptionsProviderState } from "./providers/OptionsProvider";

/**
 * Props interface for the SingleObjectSelectUI component
 */
export interface SingleObjectSelectUIProps {
  // Common props
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

  // Provider state
  providerState: OptionsProviderState;

  // Additional props
  className?: string;
  testId?: string;
  fieldName?: string;
  objectType?: string;
  objectId?: string;
}

/**
 * SingleObjectSelectUI component
 * Provides a single-select UI with autocomplete functionality
 */
export function SingleObjectSelectUI({
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
  providerState,
  className,
  testId,
  objectType,
  objectId,
  fieldName: propFieldName,
}: SingleObjectSelectUIProps) {
  const { filteredOptions, isLoading, setSearchQuery, idField, displayField } =
    providerState;

  // Find the selected option from the filtered options
  const selectedOption = value
    ? filteredOptions.find((option) => option[idField] === value)
    : null;

  // Generate the data-testid and data-field-name
  const dataTestId = testId || "SingleObjectSelectUI";
  const dataFieldName = propFieldName || name;

  return (
    <div
      data-testid={dataTestId}
      data-field-name={dataFieldName}
      data-object-type={objectType}
      {...(objectId !== undefined && { "data-object-id": objectId })}
    >
      <Autocomplete
        id={id}
        value={selectedOption}
        onChange={(_, newValue) => {
          onChange(newValue ? newValue[idField] : "");
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
          />
        )}
        renderOption={(props, option) => (
          <li
            {...props}
            data-testid={`${dataTestId}-item`}
            data-value-id={option[idField]}
            data-field-name={dataFieldName}
            data-display-text={option[displayField] || option[idField]}
            data-object-id={objectId}
          >
            {option[displayField] || option[idField] || ""}
          </li>
        )}
        className={className}
      />
    </div>
  );
}

export default SingleObjectSelectUI;
