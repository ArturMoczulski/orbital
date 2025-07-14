// FormWithReferences.interactable.ts
// This file provides a fluent API for interacting with FormWithReferences components in tests

/// <reference types="cypress" />

// Import the AutoFormInteractable base class and related types
import {
  AutoFormInteractable,
  AutoFormOptions,
  FormInputField,
} from "../AutoForm/AutoForm.interactable";
import { inputField } from "../AutoForm/FormInput.interactable";
import belongsToField, {
  BelongsToFieldInteractable,
} from "./BelongsToField.interactable";
import hasManyField, {
  HasManyFieldInteractable,
} from "./HasManyField.interactable";

/**
 * Type for form input field methods with reference field support
 */
type FormWithReferencesInputField<T> =
  | FormInputField<T>
  | BelongsToFieldInteractable
  | HasManyFieldInteractable;

/**
 * Interface for form input-related methods with reference field support
 */
type FormWithReferencesInputs<T extends Record<string, any>> = {
  [K in keyof T]: FormWithReferencesInputField<T[K]>;
};

/**
 * Interface for FormWithReferences options
 */
interface FormWithReferencesOptions extends AutoFormOptions {
  /**
   * Optional object type for reference fields
   */
  objectType?: string;

  /**
   * Optional parent element to scope the form within
   */
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>;
}

/**
 * FormWithReferencesInteractable class represents a FormWithReferences component
 * and provides methods for interacting with it, including reference fields
 */
class FormWithReferencesInteractable<
  T extends Record<string, any>,
> extends AutoFormInteractable<T> {
  /**
   * The object type for reference fields
   */
  protected objectType: string;

  /**
   * Constructor for FormWithReferencesInteractable
   * @param formTestId The data-testid of the form
   * @param objectType The type of object for reference fields
   * @param parentElement Optional parent element to scope the form within
   */
  constructor(
    formTestId: string,
    objectType: string = "Unknown",
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    super({
      dataTestId: formTestId,
      parentElement,
    });
    this.objectType = objectType;

    // Override the inputs property with a new Proxy that handles reference fields
    // @ts-ignore - We're intentionally overriding a readonly property
    this.inputs = new Proxy({} as FormWithReferencesInputs<T>, {
      get: (target, prop: string) => {
        // Skip internal properties
        if (prop === "then" || prop === "toJSON" || prop === "constructor") {
          return undefined;
        }

        // We need to handle the reference field detection differently to avoid mixing sync and async code
        // Create a lazy-loaded interactable that will determine the correct type when used
        const lazyInteractable = {
          // Define a method that will be called when any method on the interactable is accessed
          then: undefined, // Prevent being treated as a thenable

          // Create a proxy to intercept all method calls
          __proto__: new Proxy(
            {},
            {
              get: (_, method: string) => {
                // Return a function that will determine the field type and call the appropriate method
                return (...args: any[]) => {
                  return cy.then(() => {
                    // Get the form element
                    return this.get({}).then(($form) => {
                      // Look for fields with data-testid that includes ReferenceSingleField or ReferenceArrayField
                      // Use more flexible selectors to match the actual elements in the DOM
                      // Also include the case where objectType might be undefined
                      const singleSelector = `[data-testid*="ReferenceSingleField"][data-field-name="${prop}"], [data-testid*="${this.objectType}ReferenceSingleField"][data-field-name="${prop}"], [data-testid*="undefinedReferenceSingleField"][data-field-name="${prop}"]`;
                      const arraySelector = `[data-testid*="ReferenceArrayField"][data-field-name="${prop}"], [data-testid*="${this.objectType}ReferenceArrayField"][data-field-name="${prop}"], [data-testid*="undefinedReferenceArrayField"][data-field-name="${prop}"]`;

                      cy.log(
                        `Looking for reference field with selectors: ${singleSelector} or ${arraySelector}`
                      );

                      const $singleRefField = $form.find(singleSelector);
                      const $arrayRefField = $form.find(arraySelector);

                      const isSingleRef = $singleRefField.length > 0;
                      const isArrayRef = $arrayRefField.length > 0;

                      cy.log(
                        `Is "${prop}" a single reference field? ${isSingleRef}`
                      );
                      cy.log(
                        `Is "${prop}" an array reference field? ${isArrayRef}`
                      );

                      // Create the appropriate interactable based on the field type
                      let interactable;
                      if (isSingleRef) {
                        cy.log(
                          `Creating ReferenceSingleFieldInteractable for "${prop}"`
                        );
                        interactable = belongsToField({
                          fieldName: prop,
                          objectType: this.objectType,
                          parentElement: () => this.get({}),
                        });
                      } else if (isArrayRef) {
                        cy.log(
                          `Creating ReferenceArrayFieldInteractable for "${prop}"`
                        );
                        interactable = hasManyField({
                          fieldName: prop,
                          objectType: this.objectType,
                          parentElement: () => this.get({}),
                        });
                      } else {
                        cy.log(`Creating standard input field for "${prop}"`);
                        interactable = inputField({
                          fieldName: prop,
                          parentElement: () => this.get({}),
                        });
                      }

                      // Call the method on the interactable with the provided arguments
                      // Use type assertion to tell TypeScript that the method exists
                      return (interactable as any)[method](...args);
                    });
                  });
                };
              },
            }
          ),
        };

        return lazyInteractable;
      },
    });
  }

  /**
   * Fill the form with data, handling reference fields appropriately
   * @param data The data to fill the form with
   */
  fill(data: Partial<T>): FormWithReferencesInteractable<T> {
    cy.log(
      `FormWithReferencesInteractable.fill called with data:`,
      JSON.stringify(data)
    );

    // Iterate through the data and fill each field
    Object.entries(data).forEach(([key, value]) => {
      cy.log(`Processing field "${key}" with value:`, JSON.stringify(value));

      if (value !== undefined && value !== null) {
        // Use the inputs property to access the field
        // The Proxy will handle reference fields automatically
        // Use selectById which is the method available on FormInputInteractable

        // For boolean values (checkboxes), we need to handle them differently
        if (typeof value === "boolean") {
          cy.log(`Handling boolean value for ${key}: ${value}`);
          // Get the checkbox element
          this.get({})
            .find(`[name="${key}"]`)
            .then(($el) => {
              // Check if it's a checkbox
              const isCheckbox = $el.attr("type") === "checkbox";
              cy.log(`Element for ${key} is checkbox: ${isCheckbox}`);

              if (isCheckbox) {
                // Use check/uncheck instead of clear+type
                if (value) {
                  cy.log(`Checking checkbox for ${key}`);
                  cy.wrap($el).check();
                } else {
                  cy.log(`Unchecking checkbox for ${key}`);
                  cy.wrap($el).uncheck();
                }
              } else {
                // Not a checkbox, use normal selectById
                cy.log(`Using selectById for boolean ${key} (not a checkbox)`);
                (this.inputs as any)[key].selectById(value);
              }
            });
        } else if (Array.isArray(value)) {
          // Handle array values (like tags)
          cy.log(`Handling array value for ${key}: ${value}`);

          // Check if this is a reference array field
          this.get({})
            .find(
              `[data-testid*="${this.objectType}ReferenceArrayField"][data-field-name="${key}"]`
            )
            .then(($field) => {
              cy.log(`Found ${$field.length} elements for array field ${key}`);

              if ($field.length > 0) {
                // This is a reference array field, use the ReferenceArrayFieldInteractable
                cy.log(
                  `Using ReferenceArrayFieldInteractable.selectById for array field ${key}`
                );
                (this.inputs as any)[key].selectById(value);
              } else {
                // This might be a regular array field, try to use selectById
                cy.log(
                  `Attempting to use regular selectById for array field ${key}`
                );
                try {
                  (this.inputs as any)[key].selectById(value);
                } catch (error) {
                  cy.log(`Error handling array field ${key}:`, error);
                }
              }
            });
        } else {
          // Normal case - use selectById
          cy.log(`Using selectById for ${key} with value ${value}`);
          (this.inputs as any)[key].selectById(value);
        }
      }
    });

    return this;
  }

  /**
   * Submit the form
   * If data is provided, fill the form first
   * @param data Optional data to fill the form with before submitting
   */
  submit(data?: Partial<T>): FormWithReferencesInteractable<T> {
    cy.log(
      `FormWithReferencesInteractable.submit called${data ? " with data" : ""}`
    );

    // If data is provided, fill the form first
    if (data) {
      cy.log(`Filling form with data before submit:`, JSON.stringify(data));
      this.fill(data);
    }

    // Get the form element
    this.get({}).then(($form) => {
      cy.log(`Form found, submitting it`);

      // Find the submit button and click it directly
      cy.wrap($form)
        .find('button[type="submit"]')
        .should("exist")
        .click({ force: true });

      // Add a small delay to allow the form submission to complete
      cy.wait(100);
    });

    return this;
  }
}

/**
 * Create a FormWithReferences helper for interacting with the component
 * @param formTestIdOrOptions The data-testid of the form or options object
 * @param objectType The type of object for reference fields
 * @returns A FormWithReferencesInteractable instance
 */
function formWithReferences<T extends Record<string, any>>(
  formTestIdOrOptions: string | FormWithReferencesOptions,
  objectType: string = "Unknown"
): FormWithReferencesInteractable<T> {
  if (typeof formTestIdOrOptions === "string") {
    return new FormWithReferencesInteractable<T>(
      formTestIdOrOptions,
      objectType
    );
  } else {
    // Make sure formTestId is defined
    if (!formTestIdOrOptions.dataTestId) {
      throw new Error("dataTestId is required in FormWithReferencesOptions");
    }

    return new FormWithReferencesInteractable<T>(
      formTestIdOrOptions.dataTestId,
      formTestIdOrOptions.objectType || objectType,
      formTestIdOrOptions.parentElement
    );
  }
}

// Export the helper function and class
export { formWithReferences, FormWithReferencesInteractable };
export type {
  FormWithReferencesInputField,
  FormWithReferencesInputs,
  FormWithReferencesOptions,
};
