// AutoForm Cypress Helpers
// This file provides a fluent API for interacting with AutoForm components in tests

/// <reference types="cypress" />

// Import the CypressInteractable base class
import { CypressInteractable } from "../../../cypress/support/CypressInteractable";

/**
 * Type for form input field methods
 */
type FormInputField<T> = {
  /**
   * Get the input element
   */
  getElement: () => Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Type a value into the input
   */
  type: (value: T) => Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Clear the input
   */
  clear: () => Cypress.Chainable<JQuery<HTMLElement>>;
};

/**
 * Interface for form input-related methods
 */
type AutoFormInputs<T extends Record<string, any>> = {
  [K in keyof T]: FormInputField<T[K]>;
};

/**
 * Interface for form button-related methods
 */
interface AutoFormButtons<T extends Record<string, any>> {
  /**
   * Get the submit button
   */
  submit: () => Cypress.Chainable<JQuery<HTMLElement>>;
}

/**
 * AutoFormInteractable class represents an AutoForm component
 * and provides methods for interacting with it
 */
class AutoFormInteractable<
  T extends Record<string, any>,
> extends CypressInteractable<string> {
  /**
   * Input-related methods organized in a nested structure
   */
  readonly inputs: AutoFormInputs<T>;

  /**
   * Button-related methods organized in a nested structure
   */
  readonly buttons: AutoFormButtons<T>;

  constructor(formTestId: string) {
    super(formTestId); // Pass the form test ID to the parent class

    // Initialize the inputs property as a Proxy to dynamically handle field access
    this.inputs = new Proxy({} as AutoFormInputs<T>, {
      get: (target, prop: string) => {
        // Skip internal properties
        if (prop === "then" || prop === "toJSON" || prop === "constructor") {
          return undefined;
        }

        return {
          getElement: () => {
            return this.getElement().find(`[name="${prop}"]`).should("exist");
          },
          type: (value: any) => {
            return this.getElement()
              .find(`[name="${prop}"]`)
              .clear()
              .type(String(value));
          },
          clear: () => {
            return this.getElement().find(`[name="${prop}"]`).clear();
          },
        } as FormInputField<any>;
      },
    });

    // Initialize the buttons property
    this.buttons = {
      submit: () =>
        this.getElement().find('button[type="submit"]').should("exist"),
    };
  }

  /**
   * Fill the form with data
   * @param data The data to fill the form with
   */
  fill(data: Partial<T>): AutoFormInteractable<T> {
    // Iterate through the data and fill each field
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Use the inputs property to access the field
        (this.inputs as any)[key].type(value);
      }
    });

    return this;
  }

  /**
   * Submit the form
   * If data is provided, fill the form first
   * @param data Optional data to fill the form with before submitting
   */
  submit(data?: Partial<T>): AutoFormInteractable<T> {
    // If data is provided, fill the form first
    if (data) {
      this.fill(data);
    }

    // Use the buttons.submit method to click the submit button
    this.buttons.submit().click();

    return this;
  }
}

/**
 * Create an AutoForm helper for interacting with the component
 * @param formTestId The data-testid of the form
 * @returns An AutoFormInteractable instance
 */
function autoForm<T extends Record<string, any>>(
  formTestId: string
): AutoFormInteractable<T> {
  return new AutoFormInteractable<T>(formTestId);
}

// Export the helper function and class
export { autoForm, AutoFormInteractable };
export type { AutoFormButtons, AutoFormInputs, FormInputField };
