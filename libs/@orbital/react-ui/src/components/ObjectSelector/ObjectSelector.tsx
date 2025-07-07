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

  // Component selection props
  OptionsProviderComponent?: React.ComponentType<OptionsProviderProps>; // Custom provider
  UIComponent: React.ComponentType<any>; // UI component to render (required)

  // Additional props
  className?: string;
  "data-testid"?: string;
  objectType?: string;
  objectId?: string;
  componentName?: string;
};

/**
 * ObjectSelector component
 * A composable selector that combines an options provider with a UI component
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

  // Component selection props
  OptionsProviderComponent,
  UIComponent,

  // Additional props
  className,
  "data-testid": dataTestId,
  objectType,
  objectId,
  componentName = "ObjectSelector",
}: ObjectSelectorProps) {
  // Generate the data-testid
  const testId = dataTestId || componentName;

  // If no options or fetchOptions are provided, handle empty state
  if (!options && !fetchOptions) {
    return (
      <SynchronousOptionsProvider
        idField={idField}
        displayField={displayField}
        options={[]}
      >
        {(providerState) => (
          <UIComponent
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
            objectType={objectType}
            objectId={objectId}
          />
        )}
      </SynchronousOptionsProvider>
    );
  }

  // Render with the appropriate provider and UI component
  if (fetchOptions) {
    // Async options
    return (
      <AsyncOptionsProvider
        fetchOptions={fetchOptions}
        idField={idField}
        displayField={displayField}
        debounceTime={debounceTime}
        initialOptions={options}
      >
        {(providerState) => (
          <UIComponent
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
          <UIComponent
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
            objectType={objectType}
            objectId={objectId}
          />
        )}
      </SynchronousOptionsProvider>
    );
  }
}

export default ObjectSelector;
