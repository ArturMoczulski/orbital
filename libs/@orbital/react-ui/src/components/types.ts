/**
 * Base interface for objects that can be displayed in the ObjectExplorer
 */
export interface ExplorerObject {
  id: string;
  parentId?: string | null;
  name: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Query result type alias for data fetching hooks.
 * This allows passing query hook results directly to components.
 */
export interface QueryResult<T extends ExplorerObject> {
  data?: T[];
  isLoading: boolean;
  error?: any;
}

/**
 * Props for the ObjectExplorer component
 */
export interface ObjectExplorerProps<T extends ExplorerObject> {
  /**
   * Query result containing the objects to display
   */
  queryResult: QueryResult<T>;

  /**
   * Callback function when an object is selected
   */
  onSelect: (objectId: string) => void;

  /**
   * Constructor for type inference, used to derive display name from class name.
   */
  type: { name: string };

  /**
   * Type name for the objects being displayed (e.g., "Areas", "Items", etc.)
   * Used in the header display. If omitted, `type.name + "s"` is used.
   */
  objectTypeName?: string;

  /**
   * Optional custom render function for tree nodes
   */
  renderNode?: (
    object: T,
    toggleExpand: () => void,
    handleSelect: (e: React.MouseEvent) => void
  ) => React.ReactNode;
}
