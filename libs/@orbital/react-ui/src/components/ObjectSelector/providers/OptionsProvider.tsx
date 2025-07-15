import React, { ReactNode } from "react";

/**
 * State interface for the options provider
 */
export interface OptionsProviderState {
  options: any[]; // Current options
  isLoading: boolean; // Loading state
  error?: string; // Error message if any
  searchQuery: string; // Current search query
  setSearchQuery: (query: string) => void; // Update search query
  filteredOptions: any[]; // Filtered options based on search
  idField: string; // Field to use as ID
  displayField: string | ((obj: any) => string); // Field to display or function to get display value
  getDisplayValue: (option: any) => string; // Function to get display value from an option
}

/**
 * Props interface for the options provider
 */
export interface OptionsProviderProps {
  idField?: string; // Field to use as ID (default: "_id")
  displayField?: string | ((obj: any) => string); // Field to display (default: "name") or function to get display value
  children: (state: OptionsProviderState) => ReactNode;
}

/**
 * Base abstract OptionsProvider component
 * This serves as the foundation for specific provider implementations
 */
export abstract class OptionsProvider<
  P extends OptionsProviderProps = OptionsProviderProps,
> extends React.Component<P, OptionsProviderState> {
  constructor(props: P) {
    super(props);

    const displayField = props.displayField || "name";

    this.state = {
      options: [],
      filteredOptions: [],
      isLoading: false,
      searchQuery: "",
      idField: props.idField || "_id",
      displayField: displayField,
      setSearchQuery: this.setSearchQuery.bind(this),
      getDisplayValue: this.getDisplayValue.bind(this),
    };
  }

  /**
   * Get the display value for an option
   */
  getDisplayValue(option: any): string {
    const { displayField } = this.state;

    if (!option) return "";

    if (typeof displayField === "function") {
      return displayField(option);
    }

    return String(option[displayField] || "");
  }

  /**
   * Set the search query and filter options
   */
  setSearchQuery(query: string): void {
    this.setState({ searchQuery: query }, () => {
      this.filterOptions();
    });
  }

  /**
   * Filter options based on search query
   * This can be overridden by specific providers
   */
  filterOptions(): void {
    const { options, searchQuery } = this.state;

    if (!searchQuery) {
      this.setState({ filteredOptions: options });
      return;
    }

    const filtered = options.filter((option) => {
      const displayValue = this.getDisplayValue(option);
      return displayValue.toLowerCase().includes(searchQuery.toLowerCase());
    });

    this.setState({ filteredOptions: filtered });
  }

  /**
   * Get the current state of the provider
   * This is useful for passing the state to UI components
   */
  getState(): OptionsProviderState {
    return this.state;
  }

  render() {
    return this.props.children(this.state);
  }
}

export default OptionsProvider;
