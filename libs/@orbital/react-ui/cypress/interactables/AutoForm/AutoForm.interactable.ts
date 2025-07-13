// AutoForm Cypress Helpers
// This file provides a fluent API for interacting with AutoForm components in tests

/// <reference types="cypress" />

// Import the CypressInteractable base class and inputField factory
import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";
import { FormInputInteractable, inputField } from "./FormInput.interactable";

/**
 * Type for form input field methods
 */
/**
 * Use FormInputInteractable as the base type for form input fields
 * This ensures consistency between the proxy and the actual implementation
 */
type FormInputField<T> = FormInputInteractable<T>;

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
 * Interface for AutoForm options
 */
interface AutoFormOptions extends CypressInteractableOptions {
  /**
   * The data-testid of the form
   */
  formTestId?: string;
}

/**
 * AutoFormInteractable class represents an AutoForm component
 * and provides methods for interacting with it
 */
class AutoFormInteractable<
  T extends Record<string, any>,
> extends CypressInteractable {
  /**
   * Input-related methods organized in a nested structure
   */
  readonly inputs: AutoFormInputs<T>;

  /**
   * Button-related methods organized in a nested structure
   */
  readonly buttons: AutoFormButtons<T>;

  constructor(options: string | AutoFormOptions) {
    // Handle string parameter for backward compatibility
    const opts: AutoFormOptions =
      typeof options === "string" ? { dataTestId: options } : options;

    // If formTestId is provided, use it as dataTestId
    if (typeof options !== "string" && options.formTestId) {
      opts.dataTestId = options.formTestId;
    }

    super(opts);

    // Initialize the inputs property as a Proxy to dynamically handle field access
    this.inputs = new Proxy({} as AutoFormInputs<T>, {
      get: (target, prop: string) => {
        // Skip internal properties
        if (prop === "then" || prop === "toJSON" || prop === "constructor") {
          return undefined;
        }

        return inputField({
          fieldName: prop as string,
          parentElement: () => this.get(),
        });
      },
    });

    // Initialize the buttons property
    this.buttons = {
      submit: () =>
        // Get a fresh element each time to avoid context issues
        this.get().find('button[type="submit"]').should("exist"),
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
        // Use selectById which is the method available on FormInputInteractable
        (this.inputs as any)[key].selectById(value);
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
 * @param formTestIdOrOptions The data-testid of the form or options object
 * @returns An AutoFormInteractable instance
 */
function autoForm<T extends Record<string, any>>(
  formTestIdOrOptions: string | AutoFormOptions
): AutoFormInteractable<T> {
  return new AutoFormInteractable<T>(formTestIdOrOptions);
}

// Export the helper function and class
export { autoForm, AutoFormInteractable };
export type {
  AutoFormButtons,
  AutoFormInputs,
  AutoFormOptions,
  FormInputField,
};
