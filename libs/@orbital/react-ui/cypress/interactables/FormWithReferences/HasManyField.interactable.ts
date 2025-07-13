// HasManyField.interactable.ts
// This file provides a fluent API for interacting with HasManyField components in tests

/// <reference types="cypress" />

import {
  ReferenceFieldInteractable,
  ReferenceFieldInteractableOptions,
} from "./ReferenceField.interactable";

/**
 * HasManyFieldInteractable class extends ObjectSelectorInteractable
 * to provide specific functionality for HasManyField components.
 */
/**
 * Options for HasManyFieldInteractable
 */
export interface HasManyFieldInteractableOptions
  extends ReferenceFieldInteractableOptions {
  /**
   * The type of object this selector is for (e.g., "World", "Area")
   */
  objectType: string;
}

export class HasManyFieldInteractable extends ReferenceFieldInteractable {
  /**
   * Constructor for HasManyFieldInteractable
   * @param options Options for creating the HasManyField interactable
   */
  constructor(options: HasManyFieldInteractableOptions) {
    // Pass all required parameters to the ObjectSelectorInteractable constructor
    super({
      ...options,
      fieldName: options.fieldName,
      dataTestId: "HasManyField",
      multiple: true, // HasMany fields are multi-select
    });
  }
}

/**
 * Factory function to create a HasManyField interactable
 * @param options Options for creating the HasManyField interactable
 * @returns A HasManyField interactable
 */
export function hasManyField(
  options: HasManyFieldInteractableOptions
): HasManyFieldInteractable {
  return new HasManyFieldInteractable(options);
}

// Export the factory function and class
export default hasManyField;
