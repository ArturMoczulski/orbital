// ObjectForm.interactable.ts
// This file provides a fluent API for interacting with ObjectForm components in tests

/// <reference types="cypress" />

import { CypressInteractable } from "../Cypress.interactable";
import {
  ObjectFieldsetInteractable,
  objectFieldset,
} from "../FormWithReferences/ObjectFieldset.interactable";

/**
 * ObjectFormInteractable class represents an ObjectForm component
 * and provides methods for interacting with it and its fieldsets
 */
export class ObjectFormInteractable extends CypressInteractable {
  /**
   * Constructor for ObjectFormInteractable
   * @param parentElement Optional parent element to scope the form within
   * @param index Optional index to use when multiple elements match the selector
   */
  constructor(
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    index?: number
  ) {
    super({
      dataTestId: "ObjectForm",
      parentElement,
      index,
    });
  }

  /**
   * Get a fieldset within the form by object type and optional object ID
   * @param objectType The type of object this fieldset is for
   * @param objectId Optional object ID to target a specific fieldset
   * @param index Optional index to use when multiple elements match the selector
   * @returns An ObjectFieldsetInteractable for the fieldset
   */
  fieldset(
    objectType: string,
    objectId?: string,
    index?: number
  ): ObjectFieldsetInteractable {
    // Create a parent element function that returns the form element
    const parentElement = () => this.get({});

    // Use the objectFieldset factory to create the appropriate fieldset interactable
    return objectFieldset(objectType, parentElement, objectId, index);
  }

  /**
   * Get all fieldsets within the form
   * @returns A chainable that resolves to an array of ObjectFieldsetInteractable objects
   */
  getAllFieldsets(): Cypress.Chainable<ObjectFieldsetInteractable[]> {
    return this.get({}).then(($form) => {
      const fieldsets: ObjectFieldsetInteractable[] = [];

      // Find all fieldsets within the form
      $form.find('[data-testid="ObjectFieldset"]').each((_, el) => {
        const $el = Cypress.$(el);
        const objectType = $el.attr("data-object-type");
        const objectId = $el.attr("data-object-id");

        if (objectType) {
          fieldsets.push(
            objectFieldset(objectType, () => this.get({}), objectId)
          );
        }
      });

      return cy.wrap(fieldsets);
    });
  }

  /**
   * Get all fieldsets of a specific object type
   * @param objectType The type of object to get fieldsets for
   * @returns A chainable that resolves to an array of ObjectFieldsetInteractable objects
   */
  getFieldsetsByType(
    objectType: string
  ): Cypress.Chainable<ObjectFieldsetInteractable[]> {
    return this.get({}).then(($form) => {
      const fieldsets: ObjectFieldsetInteractable[] = [];

      // Find all fieldsets of the specified type within the form
      $form
        .find(
          `[data-testid="ObjectFieldset"][data-object-type="${objectType}"]`
        )
        .each((index, el) => {
          const $el = Cypress.$(el);
          const objectId = $el.attr("data-object-id");

          fieldsets.push(
            objectFieldset(objectType, () => this.get({}), objectId, index)
          );
        });

      return cy.wrap(fieldsets);
    });
  }

  /**
   * Submit the form
   * @returns The form interactable for chaining
   */
  submit(): this {
    this.get({}).find('button[type="submit"]').click();
    return this;
  }
}

/**
 * Factory function to create an ObjectForm interactable
 * @param parentElement Optional parent element to scope the form within
 * @param index Optional index to use when multiple elements match the selector
 * @returns An ObjectForm interactable
 */
export function objectForm(
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  index?: number
): ObjectFormInteractable {
  return new ObjectFormInteractable(parentElement, index);
}

// Export the factory function and class
export default objectForm;
