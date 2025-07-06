// FormInputFields.ts
// This file provides specialized input field interactables for different input types

/// <reference types="cypress" />

import { CypressInteractable } from "../Cypress.interactable";

/**
 * Base class for all form input interactables
 */
export abstract class FormInputInteractable<
  T,
> extends CypressInteractable<string> {
  protected fieldName: string;

  constructor(
    fieldName: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    super(fieldName, parentElement);
    this.fieldName = fieldName;
  }

  override selector() {
    return [
      `input[name="${this.fieldName}"]`,
      `select[name="${this.fieldName}"]`,
      `textarea[name="${this.fieldName}"]`,
    ].join(", ");
  }

  /**
   * Set a value on the input field
   * This method will be implemented by subclasses
   */
  abstract selectById(value: T): Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Get the current value of the input field
   * @returns A chainable that resolves to the field value
   */
  getValue(): Cypress.Chainable<any> {
    return this.getElement().then(($el) => {
      // For standard inputs, get the value directly
      return cy.wrap($el.val());
    });
  }

  /**
   * Clear the input
   */
  clear(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().clear();
  }

  /**
   * Check if the field is in error state
   * @returns A chainable that resolves to a boolean
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
   * @returns A chainable that resolves to the error message
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.getElement()
      .closest(".MuiFormControl-root")
      .find(".MuiFormHelperText-root")
      .invoke("text");
  }

  /**
   * Check if the field is required
   * @returns A chainable that resolves to a boolean
   */
  isRequired(): Cypress.Chainable<boolean> {
    // First try to get the element using our selector method
    return this.getElement().then(($el) => {
      // Check if the element has the required attribute
      const isRequired = $el.attr("required") !== undefined;

      if (isRequired) {
        return cy.wrap(true);
      }

      // Check if any input elements inside are required
      const $input = $el.find("input");
      if ($input.length > 0) {
        const inputRequired =
          $input.attr("required") !== undefined ||
          $input.prop("required") === true;

        if (inputRequired) {
          return cy.wrap(true);
        }
      }

      // For Material-UI, we can also check if the label has an asterisk
      const $label = $el.find(".MuiFormLabel-asterisk");
      const hasAsterisk = $label.length > 0;

      return cy.wrap(isRequired || hasAsterisk);
    });
  }

  /**
   * Check if the field is disabled
   * @returns A chainable that resolves to a boolean
   */
  isDisabled(): Cypress.Chainable<boolean> {
    // First try to get the element using our selector method
    return this.getElement().then(($el) => {
      // Check if the element itself has the disabled attribute or class
      const elDisabled =
        $el.prop("disabled") === true ||
        $el.hasClass("Mui-disabled") ||
        $el.attr("aria-disabled") === "true";

      if (elDisabled) {
        return cy.wrap(true);
      }

      // Check if any input elements inside are disabled
      const $input = $el.find("input");
      if ($input.length > 0) {
        const inputDisabled =
          $input.prop("disabled") === true ||
          $input.hasClass("Mui-disabled") ||
          $input.attr("aria-disabled") === "true";

        if (inputDisabled) {
          return cy.wrap(true);
        }
      }

      return cy.wrap(false);
    });
  }

  // The should method is now inherited from CypressInteractable
}

/**
 * Text input interactable
 */
export class TextInputInteractable extends FormInputInteractable<string> {
  /**
   * Set a value on the text input
   */
  selectById(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().clear().type(value);
  }
}

/**
 * Number input interactable
 */
export class NumberInputInteractable extends FormInputInteractable<number> {
  /**
   * Set a value on the number input
   */
  selectById(value: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().clear().type(String(value));
  }
}

/**
 * Checkbox input interactable
 */
export class CheckboxInputInteractable extends FormInputInteractable<boolean> {
  /**
   * Set a value on the checkbox
   */
  selectById(value: boolean): Cypress.Chainable<JQuery<HTMLElement>> {
    if (value) {
      return this.check();
    } else {
      return this.uncheck();
    }
  }

  /**
   * Check the checkbox
   */
  check(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().check();
  }

  /**
   * Uncheck the checkbox
   */
  uncheck(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().uncheck();
  }
}

/**
 * Radio input interactable
 */
export class RadioInputInteractable extends FormInputInteractable<string> {
  /**
   * Set a value on the radio button
   */
  selectById(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().check(value);
  }
}

/**
 * Select input interactable
 */
export class SelectInputInteractable extends FormInputInteractable<string> {
  /**
   * Set a value on the select dropdown
   */
  selectById(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getElement().select(value);
  }

  /**
   * Get all available options
   */
  getOptions(): Cypress.Chainable<JQuery<HTMLOptionElement>> {
    return this.getElement().find("option") as unknown as Cypress.Chainable<
      JQuery<HTMLOptionElement>
    >;
  }
}

/**
 * Factory function to create an input field interactable based on the input type
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @returns A specialized input field interactable based on the input type
 */
export function inputField(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): FormInputInteractable<any> {
  // Create a temporary element to determine the input type
  const getElement = FormInputInteractable.prototype.getElement.bind({
    fieldName,
    selector: FormInputInteractable.prototype.selector,
    parentElement,
  });

  // We need to determine the input type synchronously, so we'll create a default
  // text input interactable first, then replace it with the correct type after
  // we've determined the input type
  let interactable: FormInputInteractable<any> = new TextInputInteractable(
    fieldName,
    parentElement
  );

  cy.log(`getElement`, getElement());

  // Use a one-time Cypress command to determine the input type
  getElement().then(($el) => {
    const inputType = $el.attr("type")?.toLowerCase();
    const tagName = $el.prop("tagName")?.toLowerCase();

    // Create the appropriate interactable based on the input type
    if (inputType === "checkbox") {
      interactable = new CheckboxInputInteractable(fieldName, parentElement);
    } else if (inputType === "radio") {
      interactable = new RadioInputInteractable(fieldName, parentElement);
    } else if (inputType === "number") {
      interactable = new NumberInputInteractable(fieldName, parentElement);
    } else if (tagName === "select") {
      interactable = new SelectInputInteractable(fieldName, parentElement);
    }
  });
  cy.log(`interactable: `, interactable);

  return interactable;
}

// No need to export FormInputInteractable as a type since it's already exported as a class
