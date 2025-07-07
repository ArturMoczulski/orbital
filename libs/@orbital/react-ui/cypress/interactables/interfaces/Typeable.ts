/**
 * Interface for components that can receive keyboard input
 * This interface defines methods for typing text into components
 */
export interface Typeable {
  /**
   * Types text into the component
   * @param text - The text to type
   * @returns this - for method chaining
   */
  type(text: string): this;
}
