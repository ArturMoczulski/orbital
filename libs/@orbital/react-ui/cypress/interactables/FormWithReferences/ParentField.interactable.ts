import { ObjectSelectorInteractable } from "../ObjectSelector/ObjectSelector.interactable";

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
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    objectId?: string,
    index?: number
  ) {
    // Construct a data-testid that includes the field type and name
    const dataTestId = `ParentField-${fieldName}`;

    // Pass all required parameters to the ObjectSelectorInteractable constructor
    super(
      dataTestId,
      parentElement,
      "", // prefix
      false, // multiple (Parent fields are single-select)
      objectType,
      objectId,
      index
    );

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
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectId?: string,
  index?: number
): ParentFieldInteractable {
  return new ParentFieldInteractable(
    fieldName,
    objectType,
    parentElement,
    objectId,
    index
  );
}

// Export the factory function and class
export default parentField;
