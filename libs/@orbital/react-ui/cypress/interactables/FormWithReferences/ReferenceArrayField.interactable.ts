// ReferenceArrayField.interactable.ts
// This file provides a fluent API for interacting with ReferenceArrayField components in tests

/// <reference types="cypress" />

import { MultiObjectSelectorInteractable } from "../ObjectSelector/MultiObjectSelector.interactable";

/**
 * ReferenceArrayFieldInteractable class extends MultiObjectSelectorInteractable
 * to provide specific functionality for ReferenceArrayField components.
 */
export class ReferenceArrayFieldInteractable extends MultiObjectSelectorInteractable {
  /**
   * The type of object this selector is for (e.g., "world", "area")
   */
  protected objectType: string;

  /**
   * Constructor for ReferenceArrayFieldInteractable
   * @param fieldName The name of the field
   * @param objectType The type of object this selector is for
   * @param parentElement Optional parent element to scope the field within
   */
  constructor(
    fieldName: string,
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    // Pass the objectType as the dataTestId prefix to the MultiObjectSelectorInteractable
    super(fieldName, parentElement, `${objectType}ReferenceArrayField`);
    this.objectType = objectType;
  }
}

/**
 * Factory function to create a ReferenceArrayField interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this reference field is for
 * @param parentElement Optional parent element to scope the field within
 * @returns A ReferenceArrayField interactable
 */
export function referenceArrayField(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): ReferenceArrayFieldInteractable {
  return new ReferenceArrayFieldInteractable(
    fieldName,
    objectType,
    parentElement
  );
}

// Export the factory function and class
export default referenceArrayField;
