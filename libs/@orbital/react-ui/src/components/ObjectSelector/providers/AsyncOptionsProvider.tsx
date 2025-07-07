import OptionsProvider, { OptionsProviderProps } from "./OptionsProvider";

/**
 * Props interface for the AsyncOptionsProvider
 */
export interface AsyncOptionsProviderProps extends OptionsProviderProps {
  fetchOptions: (query?: string) => Promise<any[]>; // Function to fetch options
  initialOptions?: any[]; // Optional initial options
  debounceTime?: number; // Debounce time for search in ms (default: 300)
}

/**
 * AsyncOptionsProvider component
 * Provides options from an async source with loading state and debounced search
 */
export class AsyncOptionsProvider extends OptionsProvider<AsyncOptionsProviderProps> {
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(props: AsyncOptionsProviderProps) {
    super(props);

    // Initialize with initial options if provided
    this.state = {
      ...this.state,
      options: props.initialOptions || [],
      filteredOptions: props.initialOptions || [],
      isLoading: false,
    };
  }

  componentDidMount() {
    // Fetch initial options if no initialOptions were provided
    if (!this.props.initialOptions) {
      this.fetchData();
    }
  }

  /**
   * Fetch data from the provided fetchOptions function
   */
  fetchData(query?: string): void {
    const { fetchOptions } = this.props;

    this.setState({ isLoading: true, error: undefined });

    fetchOptions(query)
      .then((data) => {
        this.setState({
          options: data,
          filteredOptions: data,
          isLoading: false,
        });
      })
      .catch((error) => {
        this.setState({
          error: error.message || "Failed to fetch options",
          isLoading: false,
        });
      });
  }

  /**
   * Override setSearchQuery to implement debounced fetching
   */
  setSearchQuery(query: string): void {
    const { debounceTime = 300 } = this.props;

    // Clear any existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Update the search query immediately
    this.setState({ searchQuery: query });

    // Debounce the actual fetch operation
    this.debounceTimer = setTimeout(() => {
      this.fetchData(query);
    }, debounceTime);
  }

  componentWillUnmount() {
    // Clear any pending debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

export default AsyncOptionsProvider;
