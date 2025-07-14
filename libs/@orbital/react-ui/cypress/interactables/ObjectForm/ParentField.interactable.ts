import {
  ObjectSelectorInteractable,
  ObjectSelectorInteractableOptions,
} from "../ObjectSelector/ObjectSelector.interactable";

/**
 * ParentFieldInteractable class extends ObjectSelectorInteractable directly
 * to provide specific functionality for ParentField components.
 * ParentField is a single-select field for recursive relationships.
 */
export class ParentFieldInteractable extends ObjectSelectorInteractable {
  /**
   * The type of object this selector is for (e.g., "Node", "Category")
   */
  protected objectType: string;

  /**
   * Constructor for ParentFieldInteractable
   * @param options Options for creating the parent field interactable
   */
  constructor(options: ParentFieldInteractableOptions) {
    // Pass all required parameters to the ObjectSelectorInteractable constructor
    super({
      ...options,
      dataTestId: `ParentField-${options.fieldName}`,
      prefix: "",
      multiple: false, // Parent fields are single-select
    });

    this.objectType = options.objectType;
  }
}

/**
 * Interface for ParentFieldInteractable options
 */
export interface ParentFieldInteractableOptions
  extends ObjectSelectorInteractableOptions {
  /**
   * The type of object this parent field is for (e.g., "Node", "Category")
   */
  objectType: string;
}

/**
 * Factory function to create a ParentField interactable
 * @param options Options for creating the parent field interactable
 * @returns A ParentField interactable
 */
export function parentField(
  options: ParentFieldInteractableOptions
): ParentFieldInteractable {
  return new ParentFieldInteractable(options);
}

// Export the factory function and class
export default parentField;
