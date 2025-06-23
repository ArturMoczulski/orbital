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
 * Query result interface
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
   * Type name for the objects being displayed (e.g., "Areas", "Items", etc.)
   * Used in the header display
   */
  objectTypeName: string;

  /**
   * Optional custom render function for tree nodes
   */
  renderNode?: (
    object: T,
    toggleExpand: () => void,
    handleSelect: (e: React.MouseEvent) => void
  ) => React.ReactNode;
}
