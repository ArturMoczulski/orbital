import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import React from "react";
import { ObjectSelector, ObjectSelectorProps } from "./ObjectSelector";

/**
 * Props interface for the SingleChoiceObjectSelector component
 * Omits the UIComponent prop since it's fixed to Autocomplete
 */
export type SingleChoiceObjectSelectorProps = Omit<
  ObjectSelectorProps,
  "UIComponent"
> & {
  // Any additional props specific to SingleChoiceObjectSelector can be added here
};

/**
 * SingleChoiceObjectSelector component
 * A wrapper around ObjectSelector that uses Material UI Autocomplete in single choice mode
 */
export function SingleChoiceObjectSelector(
  props: SingleChoiceObjectSelectorProps
) {
  // Override debounceTime for async loading indicator to show immediately
  const { fetchOptions, debounceTime, ...restProps } = props;
  const effectiveDebounceTime =
    fetchOptions && debounceTime === undefined ? 0 : debounceTime;

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

    const {
      options,
      filteredOptions,
      isLoading,
      getOptionLabel,
      getOptionValue,
      setSearchQuery,
    } = providerState;

    // Handle option selection
    // Ensure getOptionValue is a function
    const safeGetOptionValue = (option: any) => {
      if (typeof getOptionValue !== "function") {
        // Fallback to using the idField directly
        return option[providerState.idField];
      }
      return getOptionValue(option);
    };

    const handleChange = (_: any, newValue: any) => {
      onChange(newValue ? safeGetOptionValue(newValue) : null);
    };

    // Find the selected option object based on value
    const selectedOption = React.useMemo(() => {
      if (!value || !options.length) return null;
      return (
        options.find((option: any) => safeGetOptionValue(option) === value) ||
        null
      );
    }, [value, options, safeGetOptionValue]);

    return (
      <Autocomplete
        id={id}
        options={filteredOptions}
        value={selectedOption}
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
        onOpen={() => setSearchQuery("")}
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
        className={className}
        data-testid={dataTestId}
        onInputChange={(_, value) => {
          setSearchQuery(value);
        }}
      />
    );
  }, []);

  return (
    <ObjectSelector
      {...restProps}
      fetchOptions={fetchOptions}
      debounceTime={effectiveDebounceTime}
      UIComponent={AutocompleteAdapter}
    />
  );
}

export default SingleChoiceObjectSelector;
