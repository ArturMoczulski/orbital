/**
 * Base interface for objects that can be displayed in the TreeExplorer
 */
export interface TreeNodeData {
  _id: string;
  parentId?: string | null;
  name: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Query result type alias for data fetching hooks.
 * This allows passing query hook results directly to components.
 */
export interface QueryResult<T extends TreeNodeData> {
  data?: T[];
  isLoading: boolean;
  error?: any;
}

/**
 * Interface for RTK Query API hooks used by TreeExplorer
 */
export interface TreeExplorerAPI<T extends TreeNodeData> {
  /**
   * Query hook for fetching all objects
   * Should return a QueryResult<T>
   */
  queryHook: () => QueryResult<T>;

  /**
   * Mutation hook for creating a new object
   * Should return a tuple with the mutation function as the first element
   * The mutation function should return a Promise with an unwrap method (RTK Query standard)
   */
  createHook?: () => [(data: any) => { unwrap: () => Promise<any> }, any];

  /**
   * Mutation hook for deleting an object
   * Should return a tuple with the mutation function as the first element
   * The mutation function should return a Promise with an unwrap method (RTK Query standard)
   */
  deleteHook?: () => [
    (data: { _id: string }) => { unwrap: () => Promise<any> },
    any,
  ];
}

/**
 * Props for the TreeExplorer component
 */
export interface TreeExplorerProps<T extends TreeNodeData> {
  /**
   * Query result containing the objects to display
   * Optional if api is provided
   */
  queryResult?: QueryResult<T>;

  /**
   * Callback function when an object is selected
   * Note: This is being deprecated in favor of itemActions
   */
  onSelect?: (object: T) => void;

  /**
   * Type name for the objects being displayed (e.g., "Area", "Item", etc.)
   * Used to derive the type prefix and to infer API endpoints
   */
  type: string;

  /**
   * Type name for the objects being displayed (e.g., "Areas", "Items", etc.)
   * Used in the header display. If omitted, `type + "s"` is used.
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

  /**
   * Optional Zod schema for the AutoForm in the add object dialog
   * If provided, this schema will be used instead of the default schema
   */
  schema?: any;

  /**
   * Optional callback function when a new object is added
   * This will be called with the form data when the add form is submitted
   * If not provided and api is provided, a default handler will be created
   */
  onAdd?: (data: any) => void;

  /**
   * Optional callback function when an object is deleted
   * This will be called with the object when the delete button is clicked
   * If not provided and api is provided, a default handler will be created
   */
  onDelete?: (object: T) => void;

  /**
   * Optional function to render custom action buttons for each item
   * Will be placed next to each item in the tree
   * Receives the object and the default actions component as parameters
   * This allows consumers to use, modify, or replace the default actions
   */
  itemActions?: (object: T, defaultActions: React.ReactNode) => React.ReactNode;

  /**
   * Optional RTK Query API object
   * If provided, the component will use the hooks defined in the API interface
   */
  api?: TreeExplorerAPI<T>;

  /**
   * Optional custom query hook
   * If provided, this will be used instead of the inferred query hook from the api
   */
  query?: () => QueryResult<T>;
}
