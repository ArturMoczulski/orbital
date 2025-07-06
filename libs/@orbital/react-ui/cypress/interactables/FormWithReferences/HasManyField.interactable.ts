// HasManyField.interactable.ts
// This file provides a fluent API for interacting with HasManyField components in tests

/// <reference types="cypress" />

import { ObjectSelectorInteractable } from "../ObjectSelector";

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
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    // Pass the objectType as the dataTestId prefix to the ObjectSelectorInteractable
    // and set multiple to true since this is an array field
    super(fieldName, parentElement, `${objectType}HasManyField`, true);
    this.objectType = objectType;
  }

  /**
   * Use the parent class implementation for isRequired
   */
  override isRequired(): Cypress.Chainable<boolean> {
    return super.isRequired();
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
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): HasManyFieldInteractable {
  return new HasManyFieldInteractable(fieldName, objectType, parentElement);
}

// Export the factory function and class
export default hasManyField;
