// ReferenceSingleField.interactable.ts
// This file provides a fluent API for interacting with ReferenceSingleField components in tests

/// <reference types="cypress" />

import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * ReferenceSingleFieldInteractable class represents a ReferenceSingleField component
 * and provides methods for interacting with it
 */
export class ReferenceSingleFieldInteractable extends FormInputInteractable<string> {
  /**
   * Override the selector method to target the ReferenceSingleField component
   * This looks for a select field with the given name
   */
  override selector() {
    return [
      `[data-testid=ReferenceSingleField][name="${this.fieldName}"]`,
      `div[role="button"]:has([name="${this.fieldName}"])`,
      `[name="${this.fieldName}"]`,
    ].join(", ");
  }

  /**
   * Set a value on the reference field by selecting an option
   * @param value The value to select
   */
  override setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and click to open the dropdown
    // For Material-UI Select, we need to click the div with role="button" that wraps the input
    const element = this.getElement();

    // Force click because Material UI might have elements with pointer-events: none
    element.click({ force: true });

    // Material UI renders the dropdown in a portal at the body level
    // We need to use the element to trigger the dropdown, but then find the options in the body

    // If value is empty, select the "None" option
    if (!value) {
      return element.then(() => {
        return cy
          .get("body")
          .find("li.MuiMenuItem-root")
          .contains("None")
          .click();
      });
    }

    // Find the option with the given value and click it
    return element.then(() => {
      return cy
        .get("body")
        .find(`li.MuiMenuItem-root[data-value="${value}"]`)
        .click();
    });
  }

  /**
   * Select an option by its display text
   * @param displayText The text displayed in the option
   */
  selectByText(displayText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and click to open the dropdown
    const element = this.getElement();
    element.click({ force: true });

    // Material UI renders the dropdown in a portal at the body level
    // We need to use the element to trigger the dropdown, but then find the options in the body
    return element.then(() => {
      return cy
        .get("body")
        .find("li.MuiMenuItem-root")
        .contains(displayText)
        .click();
    });
  }

  /**
   * Get all available options
   */
  getOptions(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and click to open the dropdown
    const element = this.getElement();
    element.click({ force: true });

    // Material UI renders the dropdown in a portal at the body level
    // We need to use the element to trigger the dropdown, but then find the options in the body
    return element.then(() => {
      return cy.get("body").find("li.MuiMenuItem-root");
    });
  }

  /**
   * Get the currently selected option's text
   */
  getSelectedText(): Cypress.Chainable<string> {
    // For Material-UI Select, the selected text is in the div with class MuiSelect-select
    // which might be a sibling or parent of our element
    return this.getElement()
      .parents(".MuiFormControl-root")
      .find(".MuiSelect-select, [role=button]")
      .first()
      .invoke("text");
  }

  /**
   * Check if the field is in error state
   */
  hasError(): Cypress.Chainable<boolean> {
    // For Material-UI, the error class is on the parent FormControl
    return this.getElement()
      .parents(".MuiFormControl-root")
      .then(($el) => {
        return cy.wrap($el.find(".Mui-error").length > 0);
      });
  }

  /**
   * Get the error message if any
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.getElement()
      .parents(".MuiFormControl-root")
      .find(".MuiFormHelperText-root")
      .invoke("text");
  }

  /**
   * Check if the field is required
   */
  isRequired(): Cypress.Chainable<boolean> {
    // Add debug logs
    cy.log(`Checking if field "${this.fieldName}" is required`);

    // First try to get the element using our selector method
    return this.getElement().then(($el) => {
      cy.log(`Found element: ${$el.length > 0 ? "Yes" : "No"}`);

      // Check if the element has the required attribute
      const isRequired = $el.attr("required") !== undefined;
      cy.log(`Element required attribute: ${isRequired}`);

      // Also check the parent TextField component
      const $textField = $el.parents("[data-testid=ReferenceSingleField]");
      cy.log(`Found TextField parent: ${$textField.length > 0 ? "Yes" : "No"}`);

      if ($textField.length > 0) {
        const textFieldRequired = $textField.attr("required") !== undefined;
        cy.log(`TextField required attribute: ${textFieldRequired}`);
        return cy.wrap(isRequired || textFieldRequired);
      }

      return cy.wrap(isRequired);
    });
  }

  /**
   * Check if the field is disabled
   */
  isDisabled(): Cypress.Chainable<boolean> {
    // Add debug logs
    cy.log(`Checking if field "${this.fieldName}" is disabled`);

    // First try to get the element using our selector method
    return this.getElement().then(($el) => {
      cy.log(`Found element: ${$el.length > 0 ? "Yes" : "No"}`);

      // Check if the element itself has the disabled attribute
      const elDisabled = $el.prop("disabled") === true;
      cy.log(`Element disabled prop: ${elDisabled}`);

      if (elDisabled) {
        return cy.wrap(true);
      }

      // Check if the parent FormControl has the disabled class or attribute
      const $formControl = $el.parents(".MuiFormControl-root");
      cy.log(
        `Found FormControl parent: ${$formControl.length > 0 ? "Yes" : "No"}`
      );

      const formControlDisabled =
        $formControl.hasClass("Mui-disabled") ||
        $formControl.attr("aria-disabled") === "true";

      cy.log(`FormControl disabled: ${formControlDisabled}`);

      return cy.wrap(formControlDisabled);
    });
  }
}

/**
 * Factory function to create a ReferenceSingleField interactable
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @returns A ReferenceSingleField interactable
 */
export function referenceSingleField(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): ReferenceSingleFieldInteractable {
  return new ReferenceSingleFieldInteractable(fieldName, parentElement);
}

// Export the factory function and class
export default referenceSingleField;
