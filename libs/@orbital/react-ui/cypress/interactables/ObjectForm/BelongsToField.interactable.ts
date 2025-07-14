// BelongsToField.interactable.ts
// This file provides a fluent API for interacting with BelongsToField components in tests

/// <reference types="cypress" />

import {
  ReferenceFieldInteractable,
  ReferenceFieldInteractableOptions,
} from "./ReferenceField.interactable";

/**
 * BelongsToFieldInteractable class represents a BelongsToField component
 * and provides methods for interacting with it.
 *
 * Since BelongsToField is a wrapper around ReferenceField with multiple=false,
 * this interactable extends ReferenceFieldInteractable with minimal overrides.
 */
/**
 * Options for BelongsToFieldInteractable
 */
export interface BelongsToFieldInteractableOptions
  extends ReferenceFieldInteractableOptions {
  // No additional options needed for BelongsToField, it inherits all from ReferenceField
}

export class BelongsToFieldInteractable extends ReferenceFieldInteractable {
  /**
   * Constructor for BelongsToFieldInteractable
   * @param options Options for creating the BelongsToField interactable
   */
  constructor(options: BelongsToFieldInteractableOptions) {
    // Call parent constructor with the options
    super({
      ...options,
      fieldName: options.fieldName,
      dataTestId: "BelongsToField", // Override dataTestId with fixed value
    });
  }
}

/**
 * Factory function to create a BelongsToField interactable
 * @param options Options for creating the BelongsToField interactable
 * @returns A BelongsToField interactable
 */
export function belongsToField(
  options: BelongsToFieldInteractableOptions
): BelongsToFieldInteractable {
  return new BelongsToFieldInteractable(options);
}

// Export the factory function and class
export default belongsToField;
