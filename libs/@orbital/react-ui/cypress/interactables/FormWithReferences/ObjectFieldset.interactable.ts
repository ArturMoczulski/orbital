// ObjectFieldset.interactable.ts
// This file provides a fluent API for interacting with ObjectFieldset components in tests

/// <reference types="cypress" />

import {
  FormInputInteractable,
  inputField,
} from "../AutoForm/FormInput.interactable";
import { CypressInteractable } from "../Cypress.interactable";

/**
 * ObjectFieldsetInteractable class represents an ObjectFieldset component
 * and provides methods for interacting with it and its fields
 */
export class ObjectFieldsetInteractable extends CypressInteractable<string> {
  /**
   * The object type for this fieldset (e.g., "User", "Post", "Address")
   */
  protected objectType: string;

  /**
   * The object ID for this fieldset (optional)
   */
  protected objectId?: string;

  /**
   * Index to use when multiple elements match the selector
   */
  protected index?: number;

  /**
   * Constructor for ObjectFieldsetInteractable
   * @param objectType The type of object this fieldset is for
   * @param parentElement Optional parent element to scope the fieldset within
   * @param objectId Optional object ID to target a specific fieldset
   * @param index Optional index to use when multiple elements match the selector
   */
  constructor(
    objectType: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    objectId?: string,
    index?: number
  ) {
    super(objectType, parentElement);
    this.objectType = objectType;
    this.objectId = objectId;
    this.index = index;
  }

  /**
   * Override the selector method to target the fieldset
   * This looks for a div with data-testid="ObjectFieldset" and data-object-type="${objectType}"
   * or with data-object-type attribute
   */
  override selector() {
    // First try the specific PascalCase format with both type and ID if available
    if (this.objectId) {
      return `[data-testid="ObjectFieldset"][data-object-type="${this.objectType}"][data-object-id="${this.objectId}"]`;
    }
    // Otherwise just use the object type
    return `[data-testid="ObjectFieldset"][data-object-type="${this.objectType}"]`;
  }

  /**
   * Get a more flexible selector that will match the fieldset even if data-object-type is not set
   * or has a different value
   */
  flexibleSelector() {
    const selectors = [];

    // Try with both data-object-type and data-object-id if available
    if (this.objectId) {
      selectors.push(
        `[data-testid="ObjectFieldset"][data-object-type="${this.objectType}"][data-object-id="${this.objectId}"]`
      );
      selectors.push(
        `[data-testid="ObjectFieldset"][data-object-id="${this.objectId}"]`
      );
      selectors.push(
        `[data-object-type="${this.objectType}"][data-object-id="${this.objectId}"]`
      );
    }

    // Add selectors without object ID
    selectors.push(
      `[data-testid="ObjectFieldset"][data-object-type="${this.objectType}"]`
    );
    selectors.push(`[data-testid="ObjectFieldset"]`);
    selectors.push(`[data-object-type="${this.objectType}"]`);

    return selectors.join(", ");
  }

  /**
   * Get the element for this fieldset
   * This method adds additional fallback selectors if the primary selector doesn't find anything
   * It also handles the case where the fieldset is wrapped in a Card component
   */
  override getElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Try the primary selector first
    return cy.get(this.selector()).then(($el) => {
      // Check if multiple elements were found and no index was provided
      if ($el.length > 1 && this.index === undefined) {
        throw new Error(
          `Multiple elements (${$el.length}) found matching selector "${this.selector()}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
        );
      }

      // If index is provided, return the element at that index
      if (this.index !== undefined && $el.length > 0) {
        if (this.index >= $el.length) {
          throw new Error(
            `Index ${this.index} is out of bounds. Only ${$el.length} elements found matching selector "${this.selector()}".`
          );
        }
        return cy.wrap($el.eq(this.index));
      }

      if ($el.length > 0) {
        return cy.wrap($el);
      }

      // If not found, try alternative selectors
      cy.log(`Element not found with selector: ${this.selector()}`);
      cy.log(`Trying alternative selectors for objectType: ${this.objectType}`);

      // First, try to find the element inside a Card component
      cy.log(`Checking if the element is inside a Card component`);
      return cy
        .get(`.MuiCard-root .MuiCardContent-root ${this.selector()}`)
        .then(($cardEl) => {
          if ($cardEl.length > 0) {
            cy.log(`Found element inside Card component`);

            // Check if multiple elements were found and no index was provided
            if ($cardEl.length > 1 && this.index === undefined) {
              throw new Error(
                `Multiple elements (${$cardEl.length}) found inside Card matching selector "${this.selector()}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
              );
            }

            // If index is provided, return the element at that index
            if (this.index !== undefined) {
              if (this.index >= $cardEl.length) {
                throw new Error(
                  `Index ${this.index} is out of bounds. Only ${$cardEl.length} elements found inside Card matching selector "${this.selector()}".`
                );
              }
              return cy.wrap($cardEl.eq(this.index));
            }

            return cy.wrap($cardEl);
          }

          // If not found inside a Card, try the flexible selector
          return cy.get(this.flexibleSelector()).then(($flexEl) => {
            // Check if multiple elements were found with flexible selector and no index was provided
            if ($flexEl.length > 1 && this.index === undefined) {
              throw new Error(
                `Multiple elements (${$flexEl.length}) found matching flexible selector "${this.flexibleSelector()}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
              );
            }

            // If index is provided, return the element at that index
            if (this.index !== undefined && $flexEl.length > 0) {
              if (this.index >= $flexEl.length) {
                throw new Error(
                  `Index ${this.index} is out of bounds. Only ${$flexEl.length} elements found matching flexible selector "${this.flexibleSelector()}".`
                );
              }
              return cy.wrap($flexEl.eq(this.index));
            }

            if ($flexEl.length > 0) {
              return cy.wrap($flexEl);
            }

            // Finally, try to find the element inside a Card component using the flexible selector
            return cy
              .get(
                `.MuiCard-root .MuiCardContent-root ${this.flexibleSelector()}`
              )
              .then(($cardFlexEl) => {
                if ($cardFlexEl.length > 0) {
                  cy.log(
                    `Found element inside Card component using flexible selector`
                  );

                  // Check if multiple elements were found and no index was provided
                  if ($cardFlexEl.length > 1 && this.index === undefined) {
                    throw new Error(
                      `Multiple elements (${$cardFlexEl.length}) found inside Card matching flexible selector "${this.flexibleSelector()}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
                    );
                  }

                  // If index is provided, return the element at that index
                  if (this.index !== undefined) {
                    if (this.index >= $cardFlexEl.length) {
                      throw new Error(
                        `Index ${this.index} is out of bounds. Only ${$cardFlexEl.length} elements found inside Card matching flexible selector "${this.flexibleSelector()}".`
                      );
                    }
                    return cy.wrap($cardFlexEl.eq(this.index));
                  }

                  return cy.wrap($cardFlexEl);
                }

                // If still not found, return an empty element
                return cy.wrap($flexEl);
              });
          });
        });
    });
  }

  /**
   * Get a field within the fieldset by name
   * @param fieldName The name of the field to get
   * @returns A FormInputInteractable for the field
   */
  field(fieldName: string): FormInputInteractable<any> {
    // Create a parent element function that returns the fieldset element
    const parentElement = () => this.getElement();

    // Use the inputField factory to create the appropriate field interactable
    return inputField(fieldName, parentElement);
  }

  /**
   * Get all field names in the fieldset
   * @returns A chainable that resolves to an array of field names
   */
  getFieldNames(): Cypress.Chainable<string[]> {
    return this.getElement().then(($fieldset) => {
      // Find all input elements with a name attribute
      const inputNames: string[] = [];

      // Check for standard input elements
      $fieldset
        .find("input[name], select[name], textarea[name]")
        .each((_, el) => {
          const name = Cypress.$(el).attr("name");
          if (name && !inputNames.includes(name)) {
            inputNames.push(name);
          }
        });

      // Also check for special components like ObjectSelector
      $fieldset.find("[data-field-name]").each((_, el) => {
        const name = Cypress.$(el).attr("data-field-name");
        if (name && !inputNames.includes(name)) {
          inputNames.push(name);
        }
      });

      return cy.wrap(inputNames);
    });
  }

  /**
   * Check if a field exists in the fieldset
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  hasField(fieldName: string): Cypress.Chainable<boolean> {
    return this.getElement().then(($fieldset) => {
      // Check for standard input elements
      const hasStandardInput =
        $fieldset.find(
          `input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`
        ).length > 0;

      // Check for special components
      const hasSpecialComponent =
        $fieldset.find(`[data-field-name="${fieldName}"]`).length > 0;

      return cy.wrap(hasStandardInput || hasSpecialComponent);
    });
  }

  /**
   * Set a value on a field within the fieldset
   * @param fieldName The name of the field to set
   * @param value The value to set
   * @returns The fieldset interactable for chaining
   */
  setFieldValue(fieldName: string, value: any): this {
    this.field(fieldName).selectById(value);
    return this;
  }

  /**
   * Get the value of a field within the fieldset
   * @param fieldName The name of the field to get the value of
   * @returns A chainable that resolves to the field value
   */
  getFieldValue(fieldName: string): Cypress.Chainable<any> {
    // Get the field element
    return this.getElement()
      .find(
        `input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`
      )
      .then(($field) => {
        if ($field.length === 0) {
          // If not found as a standard input, try to use the field interactable
          return this.field(fieldName).getValue();
        }

        // For standard inputs, get the value directly
        return cy.wrap($field.val());
      });
  }

  /**
   * Check if a field has an error
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  fieldHasError(fieldName: string): Cypress.Chainable<boolean> {
    return this.field(fieldName).hasError();
  }

  /**
   * Get the error message for a field
   * @param fieldName The name of the field to get the error message for
   * @returns A chainable that resolves to the error message
   */
  getFieldErrorMessage(fieldName: string): Cypress.Chainable<string> {
    return this.field(fieldName).getErrorMessage();
  }

  /**
   * Check if a field is required
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  isFieldRequired(fieldName: string): Cypress.Chainable<boolean> {
    return this.field(fieldName).isRequired();
  }

  /**
   * Check if a field is disabled
   * @param fieldName The name of the field to check
   * @returns A chainable that resolves to a boolean
   */
  isFieldDisabled(fieldName: string): Cypress.Chainable<boolean> {
    return this.field(fieldName).isDisabled();
  }

  /**
   * Get the object type from the component's data-object-type attribute
   * @returns A chainable that resolves to the object type or undefined if not set
   */
  getObjectType(): Cypress.Chainable<string | undefined> {
    // Use a variable outside the .then() to store the result
    let objectTypeResult: string | undefined;

    // First get the element
    return (
      this.getElement()
        .then(($el) => {
          // First try to get the attribute directly from the element
          objectTypeResult = $el.attr("data-object-type") || undefined;

          // If not found and the element is inside a Card, try to find it in the Card's header
          if (!objectTypeResult && $el.closest(".MuiCard-root").length > 0) {
            // Try to get it from the CardHeader title
            const cardHeaderTitle = $el
              .closest(".MuiCard-root")
              .find(".MuiCardHeader-content .MuiCardHeader-title")
              .text();
            if (cardHeaderTitle) {
              // Extract object type from the header title (format: "ObjectType: Name")
              const match = cardHeaderTitle.match(/^([^:]+):/);
              if (match && match[1]) {
                objectTypeResult = match[1].trim();
              }
            }
          }
        })
        // Then wrap the result in a separate chain
        .then(() => {
          return cy.wrap(objectTypeResult);
        })
    );
  }

  /**
   * Get the object ID from the component's data-object-id attribute
   * @returns A chainable that resolves to the object ID or undefined if not set
   */
  getObjectId(): Cypress.Chainable<string | undefined> {
    // Use a variable outside the .then() to store the result
    let objectIdResult: string | undefined;

    // First get the element
    return (
      this.getElement()
        .then(($el) => {
          // First try to get the attribute directly from the element
          objectIdResult = $el.attr("data-object-id") || undefined;

          // If not found and the element is inside a Card, check if there's a data-object-id on the Card
          if (!objectIdResult && $el.closest(".MuiCard-root").length > 0) {
            const cardObjectId = $el
              .closest(".MuiCard-root")
              .attr("data-object-id");
            if (cardObjectId) {
              objectIdResult = cardObjectId;
            }
          }
        })
        // Then wrap the result in a separate chain
        .then(() => {
          return cy.wrap(objectIdResult);
        })
    );
  }
}

/**
 * Factory function to create an ObjectFieldset interactable
 * @param objectType The type of object this fieldset is for
 * @param parentElement Optional parent element to scope the fieldset within
 * @returns An ObjectFieldset interactable
 */
export function objectFieldset(
  objectType: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectId?: string,
  index?: number
): ObjectFieldsetInteractable {
  return new ObjectFieldsetInteractable(
    objectType,
    parentElement,
    objectId,
    index
  );
}

// Export the factory function and class
export default objectFieldset;
