import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import React from "react";
import { ObjectSelector, ObjectSelectorProps } from "./ObjectSelector";

/**
 * Props interface for the MultiChoiceObjectSelector component
 * Omits the UIComponent prop since it's fixed to Autocomplete
 */
export type MultiChoiceObjectSelectorProps = Omit<
  ObjectSelectorProps,
  "UIComponent"
> & {
  // Any additional props specific to MultiChoiceObjectSelector can be added here
};

/**
 * MultiChoiceObjectSelector component
 * A wrapper around ObjectSelector that uses Material UI Autocomplete in multiple choice mode
 */
export function MultiChoiceObjectSelector(
  props: MultiChoiceObjectSelectorProps
) {
  // Create an adapter component that maps ObjectSelector props to Autocomplete props
  const AutocompleteAdapter = React.useCallback((adapterProps: any) => {
    const {
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
      "data-testid": dataTestId,
    } = adapterProps;

    const { options, loading, getOptionLabel, getOptionValue, searchOptions } =
      providerState;

    // Ensure getOptionValue is a function
    const safeGetOptionValue = (option: any) => {
      if (typeof getOptionValue !== "function") {
        // Fallback to using the idField directly
        return option[providerState.idField];
      }
      return getOptionValue(option);
    };

    // Handle option selection for multiple choice
    const handleChange = (_: any, newValues: any[]) => {
      // Map the selected option objects to their values
      const selectedValues = newValues.map((option) =>
        safeGetOptionValue(option)
      );
      onChange(selectedValues);
    };

    // Find the selected option objects based on values array
    const selectedOptions = React.useMemo(() => {
      if (!value || !Array.isArray(value) || !options.length) return [];

      // Map each value to its corresponding option object
      return value
        .map((val) =>
          options.find((option: any) => safeGetOptionValue(option) === val)
        )
        .filter(Boolean); // Remove any undefined values
    }, [value, options, safeGetOptionValue]);

    return (
      <Autocomplete
        id={id}
        multiple
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        getOptionLabel={(option) => {
          // Handle both string and object options
          if (!option) return "";

          // Ensure getOptionLabel is a function
          if (typeof getOptionLabel !== "function") {
            // Fallback to using the displayField directly
            return typeof option === "string"
              ? option
              : String(option[providerState.displayField] || "");
          }

          return typeof option === "string" ? option : getOptionLabel(option);
        }}
        loading={loading}
        disabled={disabled || readOnly}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            helperText={errorMessage}
            required={required}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        className={className}
        data-testid={dataTestId}
        onInputChange={(_, value) => {
          if (searchOptions) {
            searchOptions(value);
          }
        }}
      />
    );
  }, []);

  return <ObjectSelector {...props} UIComponent={AutocompleteAdapter} />;
}

export default MultiChoiceObjectSelector;
