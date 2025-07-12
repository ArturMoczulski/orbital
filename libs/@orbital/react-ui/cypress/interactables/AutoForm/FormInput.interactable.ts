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
): Cypress.Chainable<T> {
  // If a custom interactable constructor is provided, use it
  if (customInteractable) {
    return cy.wrap(
      new customInteractable(fieldName, parentElement)
    ) as Cypress.Chainable<T>;
  }

  // Create a simple selector to find the element
  const inputSelector = [
    `input[name="${fieldName}"]`,
    `select[name="${fieldName}"]`,
    `textarea[name="${fieldName}"]`,
  ].join(", ");

  // Function to get the element using the parent if provided
  const getInputElement = () => {
    if (parentElement) {
      return parentElement().find(inputSelector);
    }
    return cy.get(inputSelector);
  };

  // Create a command that returns the appropriate interactable based on the element type
  return getInputElement().then(($el) => {
    // Use our new factory function to create the appropriate interactable
    return createInteractableFromInput<T>($el, fieldName, parentElement);
  });
}

/**
 * Factory function to create an appropriate interactable from a jQuery element
 * This function examines the element and its ancestors to determine the most appropriate
 * interactable type based on data-testid attributes and other characteristics
 *
 * @param $el The jQuery element to create an interactable for
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @returns A specialized interactable based on the element type
 */
export function createInteractableFromInput<
  T extends FormInputInteractable<any> = FormInputInteractable<any>,
>(
  $el: JQuery<HTMLElement>,
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): Cypress.Chainable<T> {
  // Check for data-testid on the element itself
  let dataTestId = $el.attr("data-testid");

  // If not found on the element itself, check ancestors for known component types
  if (!dataTestId) {
    // Check for BelongsToField
    const $belongsToField = $el.closest('[data-testid="BelongsToField"]');
    if ($belongsToField.length > 0) {
      dataTestId = "BelongsToField";
    }

    // Check for other known component types (can be extended as needed)
    // For example: HasManyField, ObjectSelector, etc.
    if (!dataTestId) {
      const $objectSelector = $el.closest('[data-testid^="ObjectSelector"]');
      if ($objectSelector.length > 0) {
        dataTestId = $objectSelector.attr("data-testid");
      }
    }
  }

  // Handle special cases based on the data-testid
  if (dataTestId === "BelongsToField") {
    // Import directly to avoid circular dependencies
    const {
      BelongsToFieldInteractable,
    } = require("../FormWithReferences/BelongsToField.interactable");

    // Find the closest ObjectFieldset to get the objectType
    const $fieldset = $el.closest('[data-testid="ObjectFieldset"]');
    const objectType =
      $fieldset.attr("data-object-type") || "UnknownObjectType";

    // Create the interactable with the correct objectType
    const interactable = new BelongsToFieldInteractable(
      fieldName,
      objectType,
      parentElement
    );

    return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
  }

  // Handle standard HTML elements
  const tagName = $el.prop("tagName")?.toLowerCase();
  const inputType = $el.attr("type")?.toLowerCase();

  if (tagName === "select") {
    const interactable = new SelectInputInteractable(fieldName, parentElement);
    return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
  }

  if (tagName === "input") {
    let interactable: FormInputInteractable<any>;
    switch (inputType) {
      case "checkbox":
        interactable = new CheckboxInputInteractable(fieldName, parentElement);
        break;
      case "radio":
        interactable = new RadioInputInteractable(fieldName, parentElement);
        break;
      case "number":
        interactable = new NumberInputInteractable(fieldName, parentElement);
        break;
      default:
        interactable = new TextInputInteractable(fieldName, parentElement);
        break;
    }
    return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
  }

  // Default to text input for other element types
  const interactable = new TextInputInteractable(fieldName, parentElement);
  return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
}

// No need to export FormInputInteractable as a type since it's already exported as a class
