/**
 * Interface for components that can be opened and closed
 * This interface defines methods for opening, closing, and checking the state of openable components
 */
export interface Openable {
  /**
   * Opens the component
   * @returns this - for method chaining
   */
  open(): this;

  /**
   * Closes the component
   * @returns this - for method chaining
   */
  close(): this;

  /**
   * Checks if the component is currently open
   * @returns boolean - true if the component is open, false otherwise
   */
  isOpened(): boolean;

  /**
   * Checks if the component is currently closed
   * @returns boolean - true if the component is closed, false otherwise
   */
  isClosed(): boolean;
}
