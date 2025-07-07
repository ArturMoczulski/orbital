import { Listable } from "../interfaces/Listable";
import { Openable } from "../interfaces/Openable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";
import { PopperInteractable } from "./Popper.interactable";

/**
 * Options for AutocompleteInteractable
 */
export interface AutocompleteInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional trigger element selector or interactable
   * This is the element that opens the autocomplete when clicked
   */
  triggerElement?: string | (() => Cypress.Chainable<JQuery<HTMLElement>>);
}

/**
 * Interactable for Material UI Autocomplete components
 * Implements the Openable and Listable interfaces to provide methods for
 * opening, closing, checking state, and interacting with list items
 */
export class AutocompleteInteractable
  extends MaterialUIInteractable
  implements Openable, Listable
{
  /**
   * Internal PopperInteractable instance for delegating Openable methods
   */
  protected popper: PopperInteractable;

  constructor(options: AutocompleteInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Autocomplete",
    });

    // Create internal PopperInteractable instance
    this.popper = new PopperInteractable({
      ...options,
      dataTestId: undefined,
      componentName: "Popper", // Use Popper component name for the internal instance
    });
  }

  /**
   * Gets the trigger element that opens the autocomplete
   * Delegates to the internal popper instance
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.popper.getTriggerElement();
  }

  /**
   * Triggers the autocomplete by clicking the trigger element
   * Delegates to the internal popper instance
   * @returns this - for method chaining
   */
  trigger(): this {
    this.popper.trigger();
    return this;
  }

  /**
   * Opens the autocomplete by triggering it
   * Delegates to the internal popper instance
   * @returns this - for method chaining
   */
  open(): Cypress.Chainable<void> {
    return this.isClosed().then((closed) => {
      if (closed) {
        this.popper.open();
      }
    });
  }

  /**
   * Closes the autocomplete
   * Delegates to the internal popper instance
   * @returns this - for method chaining
   */
  close(): this {
    this.isOpened().then((opened) => {
      if (opened) {
        this.popper.close();
      }
    });
    return this;
  }

  /**
   * Checks if the autocomplete is currently triggered/opened
   * Uses custom implementation for autocomplete poppers
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the autocomplete is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    return this.popper.isTriggered();
  }

  /**
   * Checks if the autocomplete is currently open
   * This is a shortcut to isTriggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the autocomplete is open
   */
  isOpened(): Cypress.Chainable<boolean> {
    return this.isTriggered();
  }

  /**
   * Checks if the autocomplete is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the autocomplete is closed
   */
  isClosed(): Cypress.Chainable<boolean> {
    return this.isOpened().then((isOpen) => !isOpen);
  }

  /**
   * Gets the content of the autocomplete
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the content element of the autocomplete
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.popper.get().find(".MuiPaper-root");
  }

  /**
   * Clicks on an element within the autocomplete content by its data-testid
   * @param dataTestId - the data-testid of the element to click
   * @returns this - for method chaining
   */
  clickOnElement(dataTestId: string): this {
    this.getContent().find(`[data-testid="${dataTestId}"]`).click();
    return this;
  }

  /**
   * Gets the listbox element that contains the options
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the listbox element
   */
  protected getListbox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.open().then(() => {
      return this.popper
        .get()
        .find('[role="listbox"]')
        .then((results) => {
          this.close();
          return results;
        });
    });
  }

  /**
   * Gets all option elements in the listbox
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - all option elements
   */
  items(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getListbox().then((listbox) => listbox.find('[role="option"]'));
  }

  /**
   * Gets a specific option element by its text content
   * @param text - The text content to search for
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the found option element
   */
  item(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.items().then((items) =>
      items.filter(`:contains("${text}")`).first()
    );
  }

  /**
   * Selects an option from the autocomplete by its text content
   * @param text - The text content of the option to select
   * @returns this - for method chaining
   */
  select(text: string): this {
    this.item(text).click();
    return this;
  }
}

export default AutocompleteInteractable;
