import OptionsProvider, { OptionsProviderProps } from "./OptionsProvider";

/**
 * Props interface for the SynchronousOptionsProvider
 */
export interface SynchronousOptionsProviderProps extends OptionsProviderProps {
  options: any[]; // Static options array
  onSearch?: (query: string) => void; // Optional callback for search events
}

/**
 * SynchronousOptionsProvider component
 * Provides options from a static array with filtering capabilities
 */
export class SynchronousOptionsProvider extends OptionsProvider<SynchronousOptionsProviderProps> {
  constructor(props: SynchronousOptionsProviderProps) {
    super(props);

    // Initialize with the provided options
    this.state = {
      ...this.state,
      options: props.options || [],
      filteredOptions: props.options || [],
    };
  }

  componentDidUpdate(prevProps: SynchronousOptionsProviderProps) {
    // Update options if they change
    if (prevProps.options !== this.props.options) {
      this.setState(
        {
          options: this.props.options || [],
          filteredOptions: this.props.options || [],
        },
        () => {
          // Re-filter if there's an active search query
          if (this.state.searchQuery) {
            this.filterOptions();
          }
        }
      );
    }
  }

  /**
   * Override setSearchQuery to call the onSearch callback if provided
   */
  setSearchQuery(query: string): void {
    const { onSearch } = this.props;

    // Call parent implementation
    super.setSearchQuery(query);

    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(query);
    }
  }
}

export default SynchronousOptionsProvider;
