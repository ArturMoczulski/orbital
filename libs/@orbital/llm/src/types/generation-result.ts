/**
 * Result of an LLM object generation operation
 * @template T The type of the generated object
 */
export interface GenerationResult<T> {
  /**
   * The generated object
   */
  output: T;

  /**
   * The full prompt that was used to generate the object
   */
  prompt: string;
}
