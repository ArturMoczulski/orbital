import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import React from "react";
import AsyncOptionsProvider from "./providers/AsyncOptionsProvider";
import { OptionsProviderProps } from "./providers/OptionsProvider";
import SynchronousOptionsProvider from "./providers/SynchronousOptionsProvider";

/**
 * Props interface for the ObjectSelector component
 */
export type ObjectSelectorProps = {
  // Common props
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  id: string;
  label?: string;
  name: string;
  onChange: (value: any) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value?: any;

  // Options data props
  options?: any[]; // Static options
  fetchOptions?: (query?: string) => Promise<any[]>; // Async fetching function
  idField?: string; // Field to use as ID (default: "_id")
  displayField?: string; // Field to display (default: "name")
  onSearch?: (query: string) => void; // Optional callback for search events
  debounceTime?: number; // Debounce time for async search in ms

  // Selection mode
  multiple?: boolean; // Whether to allow multiple selections

  // Additional props
  className?: string;
  "data-testid"?: string;
  "data-field-name"?: string; // Field name for testing
  objectType?: string;
  objectId?: string;
  componentName?: string;

  // For backward compatibility - will be ignored
  UIComponent?: React.ComponentType<any>;
  OptionsProviderComponent?: React.ComponentType<OptionsProviderProps>;
};

/**
 * ObjectSelector component
 * A selector component that supports both single and multiple choice modes
 */
export function ObjectSelector({
  // Common props
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

  // Options data props
  options,
  fetchOptions,
  idField = "_id",
  displayField = "name",
  onSearch,
  debounceTime,

  // Selection mode
  multiple = false,

  // Additional props
  className,
  "data-testid": dataTestId,
  "data-field-name": dataFieldName,
  objectType,
  objectId,
  componentName = "ObjectSelector",

  // Ignored props for backward compatibility
  UIComponent,
  OptionsProviderComponent,
}: ObjectSelectorProps) {
  // Generate the data-testid
  const testId = dataTestId || componentName;

  // Override debounceTime for async loading indicator to show immediately if not specified
  const effectiveDebounceTime =
    fetchOptions && debounceTime === undefined ? 0 : debounceTime;

  // Create an adapter component that maps provider state to Autocomplete props
  const AutocompleteAdapter = React.useCallback(
    (adapterProps: any) => {
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
        "data-field-name": dataFieldName,
      } = adapterProps;

      const {
        options,
        filteredOptions,
        isLoading,
        getOptionLabel,
        getOptionValue,
        setSearchQuery,
        searchOptions,
      } = providerState;

      // Ensure getOptionValue is a function
      const safeGetOptionValue = (option: any) => {
        if (typeof getOptionValue !== "function") {
          // Fallback to using the idField directly
          return option[providerState.idField];
        }
        return getOptionValue(option);
      };

      // Handle option selection based on multiple mode
      const handleChange = (_: any, newValue: any) => {
        if (multiple) {
          // For multiple choice, map the selected option objects to their values
          const selectedValues = newValue.map((option: any) =>
            safeGetOptionValue(option)
          );
          onChange(selectedValues);
        } else {
          // For single choice, map the selected option object to its value
          onChange(newValue ? safeGetOptionValue(newValue) : null);
        }
      };

      // Find the selected option object(s) based on value
      const selectedOption = React.useMemo(() => {
        if (!value || !options.length) {
          return multiple ? [] : null;
        }

        if (multiple) {
          // For multiple choice, map each value to its corresponding option object
          if (!Array.isArray(value)) {
            return [];
          }

          return value
            .map((val) =>
              options.find((option: any) => safeGetOptionValue(option) === val)
            )
            .filter(Boolean); // Remove any undefined values
        } else {
          // For single choice, find the option object that matches the value
          return (
            options.find(
              (option: any) => safeGetOptionValue(option) === value
            ) || null
          );
        }
      }, [value, options, safeGetOptionValue, multiple]);

      return (
        <Autocomplete
          id={id}
          multiple={multiple}
          options={filteredOptions || options}
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
          onOpen={() => setSearchQuery && setSearchQuery("")}
          loading={isLoading}
          disabled={disabled || readOnly}
          renderInput={(params) => (
            <TextField
              {...params}
              name={dataFieldName || name}
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
          data-testid={testId}
          data-field-name={dataFieldName}
          onInputChange={(_, value) => {
            if (setSearchQuery) {
              setSearchQuery(value);
            } else if (searchOptions) {
              searchOptions(value);
            }
          }}
        />
      );
    },
    [multiple]
  );

  // If no options or fetchOptions are provided, handle empty state
  if (!options && !fetchOptions) {
    return (
      <SynchronousOptionsProvider
        idField={idField}
        displayField={displayField}
        options={[]}
      >
        {(providerState) => (
          <AutocompleteAdapter
            disabled={true}
            error={error}
            errorMessage={errorMessage || "No options available"}
            id={id}
            label={label}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
            providerState={providerState}
            className={className}
            data-testid={testId}
            data-field-name={dataFieldName}
            objectType={objectType}
            objectId={objectId}
          />
        )}
      </SynchronousOptionsProvider>
    );
  }

  // Render with the appropriate provider
  if (fetchOptions) {
    // Async options
    return (
      <AsyncOptionsProvider
        fetchOptions={fetchOptions}
        idField={idField}
        displayField={displayField}
        debounceTime={effectiveDebounceTime}
        initialOptions={options}
      >
        {(providerState) => (
          <AutocompleteAdapter
            disabled={disabled}
            error={error}
            errorMessage={errorMessage}
            id={id}
            label={label}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
            providerState={providerState}
            className={className}
            data-testid={testId}
            data-field-name={dataFieldName}
            objectType={objectType}
            objectId={objectId}
          />
        )}
      </AsyncOptionsProvider>
    );
  } else {
    // Synchronous options
    return (
      <SynchronousOptionsProvider
        options={options || []}
        idField={idField}
        displayField={displayField}
        onSearch={onSearch}
      >
        {(providerState) => (
          <AutocompleteAdapter
            disabled={disabled}
            error={error}
            errorMessage={errorMessage}
            id={id}
            label={label}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
            providerState={providerState}
            className={className}
            data-testid={testId}
            data-field-name={dataFieldName}
            objectType={objectType}
            objectId={objectId}
          />
        )}
      </SynchronousOptionsProvider>
    );
  }
}

export default ObjectSelector;
