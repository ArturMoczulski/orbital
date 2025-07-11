// BelongsToField.interactable.ts
// This file provides a fluent API for interacting with BelongsToField components in tests

/// <reference types="cypress" />

import { ReferenceFieldInteractable } from "./ReferenceField.interactable";

/**
 * BelongsToFieldInteractable class represents a BelongsToField component
 * and provides methods for interacting with it.
 *
 * Since BelongsToField is a wrapper around ReferenceField with multiple=false,
 * this interactable extends ReferenceFieldInteractable with minimal overrides.
 */
export class BelongsToFieldInteractable extends ReferenceFieldInteractable {
  /**
   * Constructor for BelongsToFieldInteractable
   * Passes "BelongsToField" as the dataTestId to the parent constructor
   * This matches the data-testid attribute set on the component
   */
  constructor(
    fieldName: string,
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    objectId?: string,
    index?: number
  ) {
    // Call parent constructor with the fixed dataTestId
    super("BelongsToField", objectType, parentElement, objectId, index);
  }
}

/**
 * Factory function to create a BelongsToField interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this reference field is for
 * @param parentElement Optional parent element to scope the field within
 * @param objectId Optional object ID to further scope the field
 * @param index Optional index for when multiple fields with the same name exist
 * @returns A BelongsToField interactable
 */
export function belongsToField(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectId?: string,
  index?: number
): BelongsToFieldInteractable {
  // We still pass the fieldName to the constructor even though it's not used for the selector
  // This maintains the API compatibility and the fieldName might be used for other purposes
  return new BelongsToFieldInteractable(
    fieldName,
    objectType,
    parentElement,
    objectId,
    index
  );
}

// Export the factory function and class
export default belongsToField;
