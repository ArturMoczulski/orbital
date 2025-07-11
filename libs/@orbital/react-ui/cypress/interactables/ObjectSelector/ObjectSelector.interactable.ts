// ObjectSelector.interactable.ts
// This file provides a fluent API for interacting with ObjectSelector components in tests

/// <reference types="cypress" />

import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";

/**
 * ObjectSelectorInteractable class extends AutocompleteInteractable
 * to provide specific functionality for ObjectSelector components.
 */
export class ObjectSelectorInteractable extends AutocompleteInteractable {
  /**
   * Constructor for ObjectSelectorInteractable
   * @param fieldName The name of the field or data-testid attribute of the component
   * @param parentElement Optional parent element to scope the field within
   * @param prefix Optional prefix for the data-testid (default: "")
   * @param multiple Optional flag indicating if this is a multi-select field (default: false)
   * @param objectType Optional type of object this selector is for
   * @param objectId Optional ID of the object this selector is for
   * @param index Optional index to use when multiple elements match the selector
   */
  constructor(
    fieldName: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    prefix: string = "",
    multiple: boolean = false,
    objectType?: string,
    objectId?: string,
    index?: number
  ) {
    // Construct the data-testid based on the parameters
    const dataTestId = prefix ? `${prefix}-${fieldName}` : fieldName;

    super({
      componentName: "Autocomplete",
      dataTestId,
      parentElement,
      index,
    });
  }
}

/**
 * Factory function to create an ObjectSelector interactable
 * @param dataTestId The data-testid attribute of the component
 * @param parentElement Optional parent element to scope the field within
 * @param index Optional index to use when multiple elements match the selector
 * @returns An ObjectSelector interactable
 */
export function objectSelector(
  dataTestId: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  index?: number
): ObjectSelectorInteractable {
  // Use the new constructor with default values for the additional parameters
  return new ObjectSelectorInteractable(
    dataTestId,
    parentElement,
    "",
    false,
    undefined,
    undefined,
    index
  );
}

// Export the factory function and class
export default objectSelector;
