import { ObjectSelectorInteractable } from "../ObjectSelector/ObjectSelector.interactable";

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
   * @param fieldName The name of the field
   * @param objectType The type of object this selector is for
   * @param parentElement Optional parent element to scope the field within
   */
  constructor(
    fieldName: string,
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    objectId?: string
  ) {
    // Pass the correct data-testid prefix to the ObjectSelectorInteractable
    // and set multiple to true since this is a multi-select field
    super(
      fieldName,
      parentElement,
      "ChildrenField",
      true,
      objectType,
      objectId
    );
    this.objectType = objectType;
  }
}

/**
 * Factory function to create a ChildrenField interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this reference field is for
 * @param parentElement Optional parent element to scope the field within
 * @returns A ChildrenField interactable
 */
export function childrenField(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectId?: string
): ChildrenFieldInteractable {
  return new ChildrenFieldInteractable(
    fieldName,
    objectType,
    parentElement,
    objectId
  );
}

// Export the factory function and class
export default childrenField;
