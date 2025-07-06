// ReferenceArrayField.interactable.ts
// This file provides a fluent API for interacting with ReferenceArrayField components in tests

/// <reference types="cypress" />

import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * ReferenceArrayFieldInteractable class represents a ReferenceArrayField component
 * and provides methods for interacting with it.
 *
 * This handles the multi-select with checkboxes used in ReferenceArrayField.
 */
export class ReferenceArrayFieldInteractable extends FormInputInteractable<
  string[]
> {
  /**
   * The type of object this selector is for (e.g., "world", "area")
   * Protected so it can be accessed by subclasses
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
    super(fieldName, parentElement);
    this.objectType = objectType;
  }

  /**
   * Override the selector method to target the component
   * This looks for a select field with the given name and component type
   */
  override selector() {
    return [
      `[data-testid*="${this.objectType}ReferenceArrayField"][data-field-name="${this.fieldName}"]`,
      `[data-field-name="${this.fieldName}"][role="combobox"]`,
    ].join(", ");
  }

  /**
   * Set a value on the reference array field by selecting multiple options by ID
   * @param values Array of IDs to select
   */
  selectById(values: string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.log(
      `ReferenceArrayFieldInteractable.selectById called with values:`,
      JSON.stringify(values)
    );

    if (!values || values.length === 0) {
      cy.log(`No values to select, returning`);
      return this.getElement();
    }

    // Get the element and click to open the dropdown
    const element = this.getElement();

    // Click to open the dropdown
    element.click({ force: true });

    // For each value, find the corresponding checkbox and click it
    return element.then(($el) => {
      // Material UI renders the dropdown in a portal at the body level
      // We need to find the checkboxes in the body

      // First, clear any existing selections by clicking on each checked item
      cy.get("body")
        .find(`[role="presentation"] .MuiMenuItem-root .Mui-checked`)
        .each(($checkbox) => {
          cy.wrap($checkbox).click({ force: true });
        });

      // Now select each value
      values.forEach((value) => {
        cy.log(`Selecting value: ${value}`);
        cy.get("body")
          .find(`[role="presentation"] .MuiMenuItem-root`)
          .contains(value)
          .parent()
          .click({ force: true });
      });

      // Click away to close the dropdown
      cy.get("body").click(0, 0);

      return element;
    });
  }

  /**
   * Set values on the reference array field
   * @param values Array of values to select
   */
  setValue(values: string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectById(values);
  }

  /**
   * Get the currently selected values
   */
  getValue(): Cypress.Chainable<string[]> {
    return this.getElement()
      .invoke("val")
      .then((value) => {
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === "string") {
          return value.split(",");
        }
        return [];
      });
  }

  /**
   * Check if the field is in error state
   */
  hasError(): Cypress.Chainable<boolean> {
    // For Material-UI, the error class is on the FormControl
    return this.getElement().then(($el) => {
      // Check if the element itself has the error class
      if ($el.hasClass("Mui-error")) {
        return cy.wrap(true);
      }

      // Check if any parent elements have the error class
      const $parent = $el.closest(".MuiFormControl-root");
      if ($parent.hasClass("Mui-error")) {
        return cy.wrap(true);
      }

      // Check if any child elements have the error class
      return cy.wrap($el.find(".Mui-error").length > 0);
    });
  }

  /**
   * Get the error message if any
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.getElement()
      .closest(".MuiFormControl-root")
      .find(".MuiFormHelperText-root")
      .invoke("text");
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
