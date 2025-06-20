export interface IObjectGenerationPromptRepository {
  /**
   * Infer a prompt key from a type name, e.g. "Area" -> "area"
   */
  inferKey(typeName: string): string;

  /**
   * Retrieve the prompt text for the given key.
   */
  get(key: string): string;
}
