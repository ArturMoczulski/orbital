// FormInputFields.ts
// This file provides specialized input field interactables for different input types

/// <reference types="cypress" />

import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";

/**
 * Base class for all form input interactables
 */
/**
 * Options for FormInputInteractable
 */
export interface FormInputInteractableOptions
  extends CypressInteractableOptions {
  /**
   * The name of the form field
   */
  fieldName?: string;
}

export abstract class FormInputInteractable<T> extends CypressInteractable {
  protected fieldName?: string;

  constructor(options: FormInputInteractableOptions) {
    super(options);
    this.fieldName = options.fieldName;
  }

  selector() {
    return [
      `input[name="${this.fieldName}"]`,
      `select[name="${this.fieldName}"]`,
      `textarea[name="${this.fieldName}"]`,
    ].join(", ");
  }

  protected override validateTarget(): boolean {
    return !!this.fieldName;
  }

  /**
   * Set a value on the input field
   * This method will be implemented by subclasses
   */
  /**
   * Set a value on the input field
   * This method will be implemented by subclasses based on their input type
   * @param value The value to set
   */
  abstract setValue(value: any): Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Get the current value of the input field
   * This method will be implemented by subclasses based on their input type
   * @returns A chainable that resolves to the field value
   */
  abstract getValue(): Cypress.Chainable<any>;

  /**
   * Get the field name
   * @returns The name of the field
   */
  getFieldName(): Cypress.Chainable<string | undefined> {
    return cy.wrap(this.fieldName);
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
  constructor(options: FormInputInteractableOptions) {
    super(options);
  }
  /**
   * Set a value on the text input
   * This implementation handles React re-renders by breaking the chain
   */

  /**
   * Implementation of setValue for text inputs
   * @param value The text value to set
   */
  setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.type(value);
  }

  /**
   * Implementation of getValue for text inputs
   */
  getValue(): Cypress.Chainable<string> {
    return this.get().then(($el) => {
      const value = $el.val() as string;
      return cy.wrap(value);
    });
  }

  /**
   * Type text into the input field
   * This implementation handles React re-renders by breaking the chain
   * @returns A chainable that resolves to the element
   */
  type(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // First clear the input
    this.clear();

    // Wait a small amount of time for any React re-renders
    cy.wait(100);

    // Then get a fresh reference to the element and type the value

    // Use force: true to ensure the typing works even if the element is covered
    // or has other issues that might prevent interaction
    return this.get().type(text, { force: true });
  }

  clear() {
    // Use force: true to ensure the clear works even if the element is covered
    return this.get().clear({ force: true });
  }
}

/**
 * Number input interactable
 */
export class NumberInputInteractable extends FormInputInteractable<number> {
  constructor(options: FormInputInteractableOptions) {
    super(options);
  }
  /**
   * Set a value on the number input
   * This implementation handles React re-renders by breaking the chain
   */

  /**
   * Implementation of setValue for number inputs
   * @param value The number value to set
   */
  setValue(value: number): Cypress.Chainable<JQuery<HTMLElement>> {
    // First clear the input
    this.clear();

    // Wait a small amount of time for any React re-renders
    cy.wait(100);

    // Then get a fresh reference to the element and type the value
    return this.get().type(String(value), { force: true });
  }

  /**
   * Implementation of getValue for number inputs
   */
  getValue(): Cypress.Chainable<number> {
    return this.get().then(($el) => {
      const value = parseFloat($el.val() as string);
      return cy.wrap(value);
    });
  }

  clear() {
    return this.get().clear();
  }
}

/**
 * Checkbox input interactable
 */
export class CheckboxInputInteractable extends FormInputInteractable<boolean> {
  constructor(options: FormInputInteractableOptions) {
    super(options);
  }
  /**
   * Set a value on the checkbox
   */

  /**
   * Implementation of setValue for checkbox inputs
   * @param value The boolean value to set
   */
  setValue(value: boolean): Cypress.Chainable<JQuery<HTMLElement>> {
    if (value) {
      return this.check();
    } else {
      return this.uncheck();
    }
  }

  /**
   * Implementation of getValue for checkbox inputs
   */
  getValue(): Cypress.Chainable<boolean> {
    return this.get().then(($el) => {
      const value = $el.prop("checked") as boolean;
      return cy.wrap(value === true);
    });
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

  clear() {
    return this.get().uncheck();
  }
}

/**
 * Radio input interactable
 */
export class RadioInputInteractable extends FormInputInteractable<string> {
  constructor(options: FormInputInteractableOptions) {
    super(options);
  }
  /**
   * Set a value on the radio button
   */
  /**
   * Implementation of setValue for radio inputs
   * @param value The value to select
   */
  setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().check(value);
  }

  /**
   * Implementation of getValue for radio inputs
   */
  getValue(): Cypress.Chainable<string> {
    return this.get().then(($el) => {
      // For radio buttons, we need to find the checked one
      const $checked = $el.filter(":checked");
      const value = $checked.val() as string;
      return cy.wrap(value);
    });
  }

  clear() {
    return this.get().uncheck();
  }
}

/**
 * Select input interactable
 */
export class SelectInputInteractable extends FormInputInteractable<string> {
  constructor(options: FormInputInteractableOptions) {
    super(options);
  }
  /**
   * Set a value on the select dropdown
   */
  /**
   * Implementation of setValue for select inputs
   * @param value The value to select
   */
  setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().select(value);
  }

  /**
   * Implementation of getValue for select inputs
   */
  getValue(): Cypress.Chainable<string | string[]> {
    return this.get().then(($el) => {
      const value = $el.val() as string | string[];
      return cy.wrap(value);
    });
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
 * @param options Options for creating the input field interactable
 * @param customInteractable Optional custom interactable constructor to use instead of auto-detection
 * @returns A specialized input field interactable based on the input type
 */
export function inputField<
  T extends FormInputInteractable<any> = FormInputInteractable<any>,
>(
  options: FormInputInteractableOptions,
  customInteractable?: new (options: FormInputInteractableOptions) => T
): Cypress.Chainable<T> {
  // If a custom interactable constructor is provided, use it
  if (customInteractable) {
    return cy.wrap(new customInteractable(options)) as Cypress.Chainable<T>;
  }

  const fieldName = options.fieldName;
  const parentElement = options.parentElement;

  if (!fieldName) {
    throw new Error("fieldName is required for inputField");
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
      const parent = parentElement();
      return parent.find(inputSelector);
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
  const options: FormInputInteractableOptions = {
    fieldName,
    parentElement,
  };
  // Check for data-testid on the element itself
  let dataTestId = $el.attr("data-testid");
  let objectType: string = "";

  // If not found on the element itself, check ancestors for known component types
  if (!dataTestId) {
    // Check for BelongsToField
    const $belongsToField = $el.closest('[data-testid="BelongsToField"]');
    if ($belongsToField.length > 0) {
      dataTestId = "BelongsToField";
      objectType = $belongsToField.attr("data-object-type") as string;
    }

    const $hasManyField = $el.closest('[data-testid="HasManyField"]');
    if ($hasManyField.length > 0) {
      dataTestId = "HasManyField";
      objectType = $hasManyField.attr("data-object-type") as string;
    }
  }

  if (dataTestId == "BelongsToField") {
    const {
      BelongsToFieldInteractable,
    } = require("../ObjectForm/BelongsToField.interactable");
    return cy.wrap(
      new BelongsToFieldInteractable({
        fieldName,
        objectType,
        parentElement,
      })
    ) as unknown as Cypress.Chainable<T>;
  }

  if (dataTestId == "HasManyField") {
    const {
      HasManyFieldInteractable,
    } = require("../ObjectForm/HasManyField.interactable");
    return cy.wrap(
      new HasManyFieldInteractable({
        fieldName,
        objectType,
        parentElement,
      })
    ) as unknown as Cypress.Chainable<T>;
  }

  // Handle standard HTML elements
  const tagName = $el.prop("tagName")?.toLowerCase();
  const inputType = $el.attr("type")?.toLowerCase();

  if (tagName === "select") {
    const interactable = new SelectInputInteractable({
      fieldName,
      parentElement,
    });
    return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
  }

  if (tagName === "input") {
    let interactable: FormInputInteractable<any>;
    switch (inputType) {
      case "checkbox":
        interactable = new CheckboxInputInteractable({
          fieldName,
          parentElement,
        });
        break;
      case "radio":
        interactable = new RadioInputInteractable({ fieldName, parentElement });
        break;
      case "number":
        interactable = new NumberInputInteractable({
          fieldName,
          parentElement,
        });
        break;
      default:
        interactable = new TextInputInteractable({ fieldName, parentElement });
        break;
    }
    return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
  }

  // Default to text input for other element types
  const interactable = new TextInputInteractable({ fieldName, parentElement });
  return cy.wrap(interactable) as unknown as Cypress.Chainable<T>;
}

// No need to export FormInputInteractable as a type since it's already exported as a class
