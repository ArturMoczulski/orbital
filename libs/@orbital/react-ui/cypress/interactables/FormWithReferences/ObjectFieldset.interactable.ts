// ObjectFieldset.interactable.ts
// This file provides a fluent API for interacting with ObjectFieldset components in tests

/// <reference types="cypress" />

import {
  FormInputInteractable,
  inputField,
} from "../AutoForm/FormInput.interactable";
import { CypressInteractable } from "../Cypress.interactable";

/**
 * ObjectFieldsetInteractable class represents an ObjectFieldset component
 * and provides methods for interacting with it and its fields
 */
export class ObjectFieldsetInteractable extends CypressInteractable<string> {
  /**
   * The object type for this fieldset (e.g., "User", "Post", "Address")
   */
  protected objectType: string;

  /**
   * Constructor for ObjectFieldsetInteractable
   * @param objectType The type of object this fieldset is for
   * @param parentElement Optional parent element to scope the fieldset within
   */
  constructor(
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    super(objectType, parentElement);
    this.objectType = objectType;
  }

  /**
   * Override the selector method to target the fieldset
   * This looks for a div with data-testid="${objectType}ObjectFieldset"
   * or with data-object-id attribute
   */
  override selector() {
    // First try the specific PascalCase format
    return `[data-testid="${this.objectType}ObjectFieldset"]`;
  }

  /**
   * Get the element for this fieldset
   * This method adds additional fallback selectors if the primary selector doesn't find anything
   */
  override getElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Try the primary selector first
    return cy.get(this.selector()).then(($el) => {
      if ($el.length > 0) {
        return cy.wrap($el);
      }

      // If not found, try alternative selectors
      cy.log(`Element not found with selector: ${this.selector()}`);
      cy.log(`Trying alternative selectors for objectType: ${this.objectType}`);

      // Try with data-object-type
      return cy.get(
        [
          // Try with data-object-type
          `[data-testid*="ObjectFieldset"][data-object-type="${this.objectType}"]`,
          // Try with lowercase objectType
          `[data-testid="${this.objectType.toLowerCase()}ObjectFieldset"]`,
          // Try with data-testid containing the objectType
          `[data-testid*="${this.objectType}"]`,
        ].join(", ")
      );
    });
  }

  /**
   * Get a field within the fieldset by name
   * @param fieldName The name of the field to get
   * @returns A FormInputInteractable for the field
   */
  field(fieldName: string): FormInputInteractable<any> {
    // Create a parent element function that returns the fieldset element
    const parentElement = () => this.getElement();

    // Use the inputField factory to create the appropriate field interactable
    return inputField(fieldName, parentElement);
  }

  /**
   * Get all field names in the fieldset
   * @returns A chainable that resolves to an array of field names
   */
  getFieldNames(): Cypress.Chainable<string[]> {
    return this.getElement().then(($fieldset) => {
      // Find all input elements with a name attribute
      const inputNames: string[] = [];

      // Check for standard input elements
      $fieldset
        .find("input[name], select[name], textarea[name]")
        .each((_, el) => {
          const name = Cypress.$(el).attr("name");
          if (name && !inputNames.includes(name)) {
            inputNames.push(name);
          }
        });

      // Also check for special components like ObjectSelector
      $fieldset.find("[data-field-name]").each((_, el) => {
        const name = Cypress.$(el).attr("data-field-name");
        if (name && !inputNames.includes(name)) {
          inputNames.push(name);
        }
      });

      return cy.wrap(inputNames);
    });
  }

  /**
   * Check if a field exists in the fieldset
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  hasField(fieldName: string): Cypress.Chainable<boolean> {
    return this.getElement().then(($fieldset) => {
      // Check for standard input elements
      const hasStandardInput =
        $fieldset.find(
          `input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`
        ).length > 0;

      // Check for special components
      const hasSpecialComponent =
        $fieldset.find(`[data-field-name="${fieldName}"]`).length > 0;

      return cy.wrap(hasStandardInput || hasSpecialComponent);
    });
  }

  /**
   * Set a value on a field within the fieldset
   * @param fieldName The name of the field to set
   * @param value The value to set
   * @returns The fieldset interactable for chaining
   */
  setFieldValue(fieldName: string, value: any): this {
    this.field(fieldName).selectById(value);
    return this;
  }

  /**
   * Get the value of a field within the fieldset
   * @param fieldName The name of the field to get the value of
   * @returns A chainable that resolves to the field value
   */
  getFieldValue(fieldName: string): Cypress.Chainable<any> {
    // Get the field element
    return this.getElement()
      .find(
        `input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`
      )
      .then(($field) => {
        if ($field.length === 0) {
          // If not found as a standard input, try to use the field interactable
          return this.field(fieldName).getValue();
        }

        // For standard inputs, get the value directly
        return cy.wrap($field.val());
      });
  }

  /**
   * Check if a field has an error
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  fieldHasError(fieldName: string): Cypress.Chainable<boolean> {
    return this.field(fieldName).hasError();
  }

  /**
   * Get the error message for a field
   * @param fieldName The name of the field to get the error message for
   * @returns A chainable that resolves to the error message
   */
  getFieldErrorMessage(fieldName: string): Cypress.Chainable<string> {
    return this.field(fieldName).getErrorMessage();
  }

  /**
   * Check if a field is required
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  isFieldRequired(fieldName: string): Cypress.Chainable<boolean> {
    return this.field(fieldName).isRequired();
  }

  /**
   * Check if a field is disabled
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  isFieldDisabled(fieldName: string): Cypress.Chainable<boolean> {
    return this.field(fieldName).isDisabled();
  }
}

/**
 * Factory function to create an ObjectFieldset interactable
 * @param objectType The type of object this fieldset is for
 * @param parentElement Optional parent element to scope the fieldset within
 * @returns An ObjectFieldset interactable
 */
export function objectFieldset(
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): ObjectFieldsetInteractable {
  return new ObjectFieldsetInteractable(objectType, parentElement);
}

// Export the factory function and class
export default objectFieldset;
