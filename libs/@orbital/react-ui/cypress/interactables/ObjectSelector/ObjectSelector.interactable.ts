// ObjectSelector.interactable.ts
// This file provides a fluent API for interacting with ObjectSelector components in tests

/// <reference types="cypress" />

import {
  FormInputInteractable,
  FormInputInteractableOptions,
} from "../AutoForm/FormInput.interactable";
import { Listable, Selectable } from "../interfaces/Listable";
import { Loadable } from "../interfaces/Loadable";
import { Openable } from "../interfaces/Openable";
import { Typeable } from "../interfaces/Typeable";
import { Validatable } from "../interfaces/Validatable";
import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";
import { ChipInteractable } from "../MaterialUI/Chip.interactable";

/**
 * ObjectSelectorInteractable class extends FormInputInteractable
 * and delegates to AutocompleteInteractable for functionality.
 */
/**
 * Options for ObjectSelectorInteractable
 */
export interface ObjectSelectorInteractableOptions
  extends FormInputInteractableOptions {
  /**
   * Optional prefix for the data-testid
   */
  prefix?: string;

  /**
   * Flag indicating if this is a multi-select field
   */
  multiple?: boolean;

  /**
   * Optional type of object this selector is for
   */
  objectType?: string;

  /**
   * Optional ID of the object this selector is for
   */
  objectId?: string;

  /**
   * Optional index to use when multiple elements match the selector
   */
  index?: number;
}

export class ObjectSelectorInteractable
  extends FormInputInteractable<string | string[]>
  implements Openable, Listable, Selectable, Typeable, Validatable, Loadable
{
  /**
   * Internal AutocompleteInteractable instance for delegation
   */
  protected autocomplete: AutocompleteInteractable;

  /**
   * Constructor for ObjectSelectorInteractable
   * @param options Options for creating the object selector interactable
   */
  constructor(options: ObjectSelectorInteractableOptions) {
    super(options);

    // Create internal AutocompleteInteractable instance
    this.autocomplete = new AutocompleteInteractable({
      ...options,
      componentName: "Autocomplete",
    });
  }

  /**
   * Implementation of selectById from FormInputInteractable
   * Delegates to the select method of AutocompleteInteractable
   */
  selectById(value: string | string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    if (Array.isArray(value)) {
      // For multiple selection, we need to select each value
      value.forEach((val) => {
        this.autocomplete.open();
        this.autocomplete.select(val);
      });
      return this.get();
    } else {
      // For single selection
      this.autocomplete.open();
      this.autocomplete.select(value);
      return this.get();
    }
  }

  /**
   * Get the DOM element for this component
   * This method is required because we're extending FormInputInteractable
   */
  get(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.get();
  }

  // Delegate Openable methods to internal autocomplete instance
  open(): Cypress.Chainable<void> {
    return this.autocomplete.open();
  }

  close(): Cypress.Chainable<void> {
    return this.autocomplete.close();
  }

  isOpened(): Cypress.Chainable<boolean> {
    return this.autocomplete.isOpened();
  }

  isClosed(): Cypress.Chainable<boolean> {
    return this.autocomplete.isClosed();
  }

  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.getTriggerElement();
  }

  trigger(): this {
    this.autocomplete.trigger();
    return this;
  }

  isTriggered(): Cypress.Chainable<boolean> {
    return this.autocomplete.isTriggered();
  }

  // Delegate Listable methods to internal autocomplete instance
  items(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.items();
  }

  item(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.item(text);
  }

  select(text: string | string[]): this {
    this.autocomplete.select(text);
    return this;
  }

  selected(): Cypress.Chainable<string | string[]> {
    return this.autocomplete.selected();
  }

  clearSelection(): this {
    this.autocomplete.clearSelection();
    return this;
  }

  deselect(text: string): this {
    this.autocomplete.deselect(text);
    return this;
  }

  // Delegate Typeable methods to internal autocomplete instance
  type(text: string): this {
    this.autocomplete.type(text);
    return this;
  }

  clearTextInput(): this {
    this.autocomplete.clearTextInput();
    return this;
  }

  // Delegate Validatable methods to internal autocomplete instance
  hasError(): Cypress.Chainable<boolean> {
    return this.autocomplete.hasError();
  }

  getError(): Cypress.Chainable<string> {
    return this.autocomplete.getError();
  }

  // Delegate Loadable methods to internal autocomplete instance
  isLoading(): Cypress.Chainable<boolean> {
    return this.autocomplete.isLoading();
  }

  // Additional methods from AutocompleteInteractable that are used in tests
  textField(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.textField();
  }

  chips(): Cypress.Chainable<ChipInteractable[]> {
    return this.autocomplete.chips();
  }

  // Override FormInputInteractable methods to use the autocomplete methods
  isRequired(): Cypress.Chainable<boolean> {
    return super.isRequired();
  }

  isDisabled(): Cypress.Chainable<boolean> {
    return this.autocomplete.isDisabled();
  }

  /**
   * Override getValue to return the actual value (ID) of the selected option
   * This ensures we get the correct value from the form field
   */
  getValue(): Cypress.Chainable<string | string[]> {
    return this.autocomplete.selected();
  }

  /**
   * Override getErrorMessage to use the getError method from autocomplete
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.autocomplete.getError();
  }

  /**
   * Override clear to use the clearSelection method from autocomplete
   */
  clear(): Cypress.Chainable<JQuery<HTMLElement>> {
    this.autocomplete.clearSelection();
    return this.get();
  }
}

/**
 * Factory function to create an ObjectSelector interactable
 * @param options Options for creating the object selector interactable
 * @returns An ObjectSelector interactable
 */
export function objectSelector(
  options: ObjectSelectorInteractableOptions
): ObjectSelectorInteractable {
  return new ObjectSelectorInteractable(options);
}

// Export the factory function and class
export default objectSelector;
