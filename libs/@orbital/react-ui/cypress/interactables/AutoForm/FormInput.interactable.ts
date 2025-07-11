// FormInputFields.ts
// This file provides specialized input field interactables for different input types

/// <reference types="cypress" />

import { CypressInteractable } from "../Cypress.interactable";

/**
 * Base class for all form input interactables
 */
export abstract class FormInputInteractable<T> extends CypressInteractable {
  protected fieldName?: string;

  constructor(
    fieldNameOrOptions?:
      | string
      | {
          dataTestId?: string;
          parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>;
        },
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    // Handle string parameter for backward compatibility
    if (typeof fieldNameOrOptions === "string") {
      super({
        dataTestId: fieldNameOrOptions,
        parentElement,
      });
      this.fieldName = fieldNameOrOptions;
    } else {
      super(fieldNameOrOptions || {});
      this.fieldName = fieldNameOrOptions?.dataTestId;
    }
  }

  selector() {
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
    return this.get().then(($el) => {
      // For standard inputs, get the value directly
      return cy.wrap($el.val());
    });
  }

  /**
   * Clear the input
   */
  clear(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().clear();
  }

  /**
   * Check if the field is in error state
   * @returns A chainable that resolves to a boolean
   */
  hasError(): Cypress.Chainable<boolean> {
    // For Material-UI, the error class is on the FormControl
    return this.get().then(($el) => {
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
    return this.get()
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
    return this.get().then(($el) => {
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
    return this.get().then(($el) => {
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
    return this.get().clear().type(value);
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
    return this.get().clear().type(String(value));
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
    return this.get().check();
  }

  /**
   * Uncheck the checkbox
   */
  uncheck(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().uncheck();
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
    return this.get().check(value);
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
    return this.get().select(value);
  }

  /**
   * Get all available options
   */
  getOptions(): Cypress.Chainable<JQuery<HTMLOptionElement>> {
    return this.get().find("option") as unknown as Cypress.Chainable<
      JQuery<HTMLOptionElement>
    >;
  }
}

/**
 * Factory function to create an input field interactable based on the input type
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @param customInteractable Optional custom interactable constructor to use instead of auto-detection
 * @returns A specialized input field interactable based on the input type
 */
export function inputField<
  T extends FormInputInteractable<any> = FormInputInteractable<any>,
>(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  customInteractable?: new (
    fieldName: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) => T
): T {
  // If a custom interactable constructor is provided, use it
  if (customInteractable) {
    return new customInteractable(fieldName, parentElement);
  }

  // Create a temporary element to determine the input type
  const getElement = () => {
    const interactable = new TextInputInteractable(fieldName, parentElement);
    return interactable.get();
  };

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
    const dataTestId = $el.attr("data-testid");

    // First check if we can determine the interactable type based on data-testid
    if (dataTestId) {
      // Import necessary interactables dynamically to avoid circular dependencies
      // This is a workaround since we can't directly import here due to potential circular dependencies
      try {
        if (dataTestId === "ObjectSelector") {
          // Use require to dynamically import the ObjectSelectorInteractable
          const objectSelectorModule = require("../ObjectSelector/ObjectSelector.interactable");
          if (
            objectSelectorModule &&
            objectSelectorModule.ObjectSelectorInteractable
          ) {
            interactable = new objectSelectorModule.ObjectSelectorInteractable(
              fieldName,
              parentElement
            );
            return;
          }
        }
        // Add more data-testid checks for other component types as needed
      } catch (e) {
        cy.log(`Error loading interactable for data-testid ${dataTestId}:`, e);
      }
    }

    // If we couldn't determine the interactable type based on data-testid,
    // fall back to the original logic based on input type
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

  return interactable as unknown as T;
}

// No need to export FormInputInteractable as a type since it's already exported as a class
