// BelongsToField.interactable.ts
// This file provides a fluent API for interacting with BelongsToField components in tests

/// <reference types="cypress" />

import { ObjectSelectorInteractable } from "../ObjectSelector";

/**
 * BelongsToFieldInteractable class represents a BelongsToField component
 * and provides methods for interacting with it.
 *
 * Since BelongsToField is a wrapper around ObjectSelector, this interactable
 * extends ObjectSelectorInteractable and only overrides what's necessary.
 */
export class BelongsToFieldInteractable extends ObjectSelectorInteractable {
  /**
   * The type of object this selector is for (e.g., "world", "area")
   */
  protected objectType: string;

  /**
   * Constructor for BelongsToFieldInteractable
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
    // objectType should be in PascalCase when used in component names
    super(fieldName, parentElement, `${objectType}BelongsToField`, false);
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
 * Factory function to create a BelongsToField interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this reference field is for
 * @param parentElement Optional parent element to scope the field within
 * @returns A BelongsToField interactable
 */
export function belongsToField(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): BelongsToFieldInteractable {
  return new BelongsToFieldInteractable(fieldName, objectType, parentElement);
}

// Export the factory function and class
export default belongsToField;
