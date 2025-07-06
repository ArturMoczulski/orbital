// ObjectSelector.interactable.ts
// This file provides a fluent API for interacting with ObjectSelector components in tests

/// <reference types="cypress" />

import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * ObjectSelectorInteractable class represents an ObjectSelector component
 * and provides methods for interacting with it
 */
export class ObjectSelectorInteractable extends FormInputInteractable<string> {
  /**
   * The type of object this selector is for (e.g., "world", "area")
   * Protected so it can be accessed by subclasses
   */
  protected objectType: string;

  /**
   * Constructor for ObjectSelectorInteractable
   * @param fieldName The name of the field
   * @param objectType The type of object this selector is for
   * @param parentElement Optional parent element to scope the field within
   */
  constructor(
    fieldName: string,
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    protected componentName?: string
  ) {
    super(fieldName, parentElement);
    this.objectType = objectType;
  }

  /**
   * Get the component name from the class name
   * This removes "Interactable" from the end of the class name
   */
  protected getComponentName(): string {
    // Get the class name from the constructor
    const className = this.componentName || this.constructor.name;
    // Remove "Interactable" from the end
    return className.replace(/Interactable$/, "");
  }

  /**
   * Override the selector method to target the component
   * This looks for a select field with the given name and component type
   */
  override selector() {
    const componentName = this.getComponentName();
    return [
      `[data-testid*="${this.objectType}${componentName} ${componentName}"]`,
      `[data-testid*="${componentName}"][data-field-name="${this.fieldName}"]`,
      `[data-testid*="${componentName}"]`,
    ].join(", ");
  }

  /**
   * Get the data-testid prefix for menu items
   */
  protected getItemTestIdPrefix(): string {
    return `${this.objectType}${this.getComponentName()}`;
  }

  setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectByText(value);
  }

  /**
   * Set a value on the object selector by selecting an option by ID
   * @param value The value to select
   */
  selectById(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and click to open the dropdown using our enhanced click method
    const element = this.getElement();

    // Use our enhanced click method to open the dropdown
    this.click();

    // Material UI renders the dropdown in a portal at the body level
    // We need to use the element to trigger the dropdown, but then find the options in the body

    // If value is empty, select the "None" option
    // Get the field name from the element
    return element.then(($el) => {
      const fieldName = this.fieldName;
      const testIdPrefix = this.getItemTestIdPrefix();

      if (!value) {
        // Find the "None" option using the data attributes
        return cy
          .get("body")
          .find(
            `[data-testid="${testIdPrefix}-none"][data-field-name="${fieldName}"]`
          )
          .click();
      }

      // Find the option with the given value using the data attributes
      return cy
        .get("body")
        .find(
          `[data-testid="${testIdPrefix}-item"][data-object-id="${value}"][data-field-name="${fieldName}"]`
        )
        .click();
    });
  }

  /**
   * Select an option by its display text
   * @param displayText The text displayed in the option
   */
  selectByText(displayText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and click to open the dropdown using our enhanced click method
    const element = this.getElement();
    this.click();

    // Material UI renders the dropdown in a portal at the body level
    // We need to use the element to trigger the dropdown, but then find the options in the body
    // Get the field name from the element
    return element.then(($el) => {
      const fieldName = this.fieldName;
      const testIdPrefix = this.getItemTestIdPrefix();

      // Find the option with the given display text
      return cy
        .get("body")
        .find(
          `[data-testid="${testIdPrefix}-item"][data-field-name="${fieldName}"]`
        )
        .contains(displayText)
        .click();
    });
  }

  /**
   * Get all available options
   */
  getOptions(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and click to open the dropdown using our enhanced click method
    const element = this.getElement();
    this.click();

    // Add a wait for the dropdown to appear
    cy.wait(100);

    // Material UI renders the dropdown in a portal at the body level
    // We need to use the element to trigger the dropdown, but then find the options in the body
    // Get the field name from the element
    return element.then(($el) => {
      const fieldName = this.fieldName;
      const testIdPrefix = this.getItemTestIdPrefix();

      // Find all options using the data attributes - specifically look for the menu items
      return cy
        .get("body")
        .find(
          `[data-testid="${testIdPrefix}-none"][data-field-name="${fieldName}"], [data-testid="${testIdPrefix}-item"][data-field-name="${fieldName}"]`
        );
    });
  }

  /**
   * Get the currently selected option's text
   */
  getSelectedText(): Cypress.Chainable<string> {
    // For Material-UI Select, the selected text is in the div with class MuiSelect-select
    // which might be a sibling or parent of our element
    return this.getElement()
      .find(".MuiSelect-select, [role=button]")
      .first()
      .invoke("text");
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

      // Check if any child elements have the error class
      return cy.wrap($el.find(".Mui-error").length > 0);
    });
  }

  /**
   * Get the error message if any
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.getElement().find(".MuiFormHelperText-root").invoke("text");
  }

  /**
   * Check if the field is required
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

  /**
   * Click on the field to open the dropdown
   * For Material-UI Select, we need to click the div with role="combobox"
   * @override
   */
  override click(): this {
    const element = this.getElement();

    // Find and click the element with role="combobox" which is the clickable part in Material-UI Select
    element.find('[role="combobox"]').click({ force: true });

    // Return this for method chaining
    return this;
  }
}

/**
 * Factory function to create an ObjectSelector interactable
 * @param fieldName The name of the field
 * @param objectType The type of object this selector is for
 * @param parentElement Optional parent element to scope the field within
 * @returns An ObjectSelector interactable
 */
export function objectSelector(
  fieldName: string,
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  componentName?: string
): ObjectSelectorInteractable {
  return new ObjectSelectorInteractable(
    fieldName,
    objectType,
    parentElement,
    componentName
  );
}

// Export the factory function and class
export default objectSelector;
