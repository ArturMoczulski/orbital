import {
  ObjectSelectorInteractable,
  ObjectSelectorInteractableOptions,
} from "../ObjectSelector/ObjectSelector.interactable";

/**
 * Interface for ChildrenFieldInteractable options
 */
export interface ChildrenFieldInteractableOptions
  extends ObjectSelectorInteractableOptions {
  /**
   * The type of object this children field is for (e.g., "Node", "Category")
   */
  objectType: string;
}

/**
 * ChildrenFieldInteractable class extends ObjectSelectorInteractable directly
 * to provide specific functionality for ChildrenField components.
 * ChildrenField is a multi-select field for recursive relationships.
 */
export class ChildrenFieldInteractable extends ObjectSelectorInteractable {
  /**
   * The type of object this selector is for (e.g., "Node", "Category")
   */
  protected objectType: string;

  /**
   * Constructor for ChildrenFieldInteractable
   * @param options Options for creating the children field interactable
   */
  constructor(options: ChildrenFieldInteractableOptions) {
    // Pass all required parameters to the ObjectSelectorInteractable constructor
    super({
      ...options,
      dataTestId: `ChildrenField-${options.fieldName}`,
      prefix: "",
      multiple: true, // children fields are multi-select
    });

    this.objectType = options.objectType;
  }
}

/**
 * Factory function to create a ChildrenField interactable
 * @param options Options for creating the children field interactable
 * @returns A ChildrenField interactable
 */
export function childrenField(
  options: ChildrenFieldInteractableOptions
): ChildrenFieldInteractable {
  return new ChildrenFieldInteractable(options);
}

// Export the factory function and class
export default childrenField;
