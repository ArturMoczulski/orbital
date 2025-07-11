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
    objectId?: string,
    index?: number
  ) {
    // Construct a data-testid that includes the field type and name
    const dataTestId = `ChildrenField-${fieldName}`;

    // Pass all required parameters to the ObjectSelectorInteractable constructor
    super(
      dataTestId,
      parentElement,
      "", // prefix
      true, // multiple (children fields are multi-select)
      objectType,
      objectId,
      index
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
  objectId?: string,
  index?: number
): ChildrenFieldInteractable {
  return new ChildrenFieldInteractable(
    fieldName,
    objectType,
    parentElement,
    objectId,
    index
  );
}

// Export the factory function and class
export default childrenField;
