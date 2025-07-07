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
  displayField: string; // Field to display
}

/**
 * Props interface for the options provider
 */
export interface OptionsProviderProps {
  idField?: string; // Field to use as ID (default: "_id")
  displayField?: string; // Field to display (default: "name")
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

    this.state = {
      options: [],
      filteredOptions: [],
      isLoading: false,
      searchQuery: "",
      idField: props.idField || "_id",
      displayField: props.displayField || "name",
      setSearchQuery: this.setSearchQuery.bind(this),
    };
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
    const { options, searchQuery, displayField } = this.state;

    if (!searchQuery) {
      this.setState({ filteredOptions: options });
      return;
    }

    const filtered = options.filter((option) => {
      const displayValue = option[displayField] || "";
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
