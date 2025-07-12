// HasManyField.interactable.ts
// This file provides a fluent API for interacting with HasManyField components in tests

/// <reference types="cypress" />

import { ObjectSelectorInteractable } from "../ObjectSelector/ObjectSelector.interactable";

/**
 * HasManyFieldInteractable class extends ObjectSelectorInteractable
 * to provide specific functionality for HasManyField components.
 */
export class HasManyFieldInteractable extends ObjectSelectorInteractable {
  /**
   * The type of object this selector is for (e.g., "World", "Area")
   */
  protected objectType: string;

  /**
   * Constructor for HasManyFieldInteractable
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
    const dataTestId = `HasManyField`;

    // Pass all required parameters to the ObjectSelectorInteractable constructor
    super(
      dataTestId,
      parentElement,
      "", // prefix
      true, // multiple (HasMany fields are multi-select)
      objectType,
      objectId,
      index
    );

    this.objectType = objectType;
  }

  /**
   * Implement isRequired method for compatibility
   */
  isRequired(): Cypress.Chainable<boolean> {
    return cy.wrap(false); // Default implementation
  }
}

/**
 * Factory function to create a HasManyField interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this reference field is for
 * @param parentElement Optional parent element to scope the field within
 * @returns A HasManyField interactable
 */
export function hasManyField(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectId?: string,
  index?: number
): HasManyFieldInteractable {
  return new HasManyFieldInteractable(
    fieldName,
    objectType,
    parentElement,
    objectId,
    index
  );
}

// Export the factory function and class
export default hasManyField;
