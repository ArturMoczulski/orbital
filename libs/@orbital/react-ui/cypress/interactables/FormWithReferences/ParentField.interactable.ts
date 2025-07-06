import { ObjectSelectorInteractable } from "../ObjectSelector";

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
   * @param fieldName The name of the field
   * @param objectType The type of object this selector is for
   * @param parentElement Optional parent element to scope the field within
   */
  constructor(
    fieldName: string,
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    // Pass the correct data-testid prefix to the ObjectSelectorInteractable
    // and set multiple to false since this is a single-select field
    super(fieldName, parentElement, `${objectType}ParentField`, false);
    this.objectType = objectType;
  }
}

/**
 * Factory function to create a ParentField interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this reference field is for
 * @param parentElement Optional parent element to scope the field within
 * @returns A ParentField interactable
 */
export function parentField(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): ParentFieldInteractable {
  return new ParentFieldInteractable(fieldName, objectType, parentElement);
}

// Export the factory function and class
export default parentField;
