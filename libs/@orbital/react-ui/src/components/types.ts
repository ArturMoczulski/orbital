/**
 * Base interface for objects that can be displayed in the ObjectExplorer
 */
export interface ExplorerObject {
  _id: string;
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
   * Optional if api is provided
   */
  queryResult?: QueryResult<T>;

  /**
   * Callback function when an object is selected
   * Note: This is being deprecated in favor of itemActions
   */
  onSelect?: (objectId: string) => void;

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
   * This will be called with the object ID when the delete button is clicked
   * If not provided and api is provided, a default handler will be created
   */
  onDelete?: (objectId: string) => void;

  /**
   * Optional function to render custom action buttons for each item
   * Will be placed next to each item in the tree
   * Receives the object and the default actions component as parameters
   * This allows consumers to use, modify, or replace the default actions
   */
  itemActions?: (object: T, defaultActions: React.ReactNode) => React.ReactNode;

  /**
   * Optional RTK Query API object
   * If provided, the component will extract the appropriate hooks based on naming conventions
   */
  api?: any;

  /**
   * Optional custom query hook
   * If provided, this will be used instead of the inferred query hook from the api
   */
  query?: () => QueryResult<T>;
}
