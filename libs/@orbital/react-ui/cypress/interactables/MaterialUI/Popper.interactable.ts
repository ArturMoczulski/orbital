import { Openable } from "../interfaces/Openable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for PopperInteractable
 */
export interface PopperInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional trigger element selector or interactable
   * This is the element that opens the popper when clicked
   */
  triggerElement?: string | (() => Cypress.Chainable<JQuery<HTMLElement>>);
}

/**
 * Interactable for Material UI Popper components
 * Implements the Openable interface to provide methods for opening, closing,
 * and checking the state of the popper
 */
export class PopperInteractable
  extends MaterialUIInteractable
  implements Openable
{
  protected triggerElement?:
    | string
    | (() => Cypress.Chainable<JQuery<HTMLElement>>);

  constructor(options: PopperInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Popper",
    });
    this.triggerElement = options.triggerElement;
  }

  /**
   * Gets the trigger element that opens the popper
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    if (!this.triggerElement) {
      throw new Error("No trigger element provided for PopperInteractable");
    }

    if (typeof this.triggerElement === "string") {
      return cy.get(this.triggerElement);
    }

    return this.triggerElement();
  }

  /**
   * Triggers the popper by clicking the trigger element
   * @returns this - for method chaining
   */
  trigger(): this {
    // Click the trigger element to open the popper
    this.getTriggerElement().click();

    // Wait for the popper to be visible
    cy.wait(100); // Short wait for the popper to appear

    return this;
  }

  /**
   * Opens the popper by triggering it
   * This is a shortcut to the trigger method
   * @returns this - for method chaining
   */
  open(): this {
    return this.trigger();
  }

  /**
   * Closes the popper
   * @returns this - for method chaining
   */
  /**
   * Closes the popper
   * @returns this - for method chaining
   */
  close(): this {
    // For Material UI poppers, we need to click outside of it
    // to properly trigger the onClose handler if one exists

    // Simple approach: click in the top-left corner of the body
    cy.get("body").click(10, 10);

    // Wait a moment for the click to register
    cy.wait(100);

    // Press Escape key as a fallback
    cy.get("body").type("{esc}");

    // Wait for animations to complete
    cy.wait(300);

    return this;
  }

  /**
   * Checks if the popper is currently triggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popper is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    // Use cy.document() to check if the element exists in the DOM
    return cy.document().then((doc) => {
      // Use vanilla JS to check if the element exists
      const selector = this.selector();
      const elements = doc.querySelectorAll(selector);

      // If no elements found, return false
      if (elements.length === 0) {
        return false;
      }

      // If elements found, check visibility using jQuery
      const $el = Cypress.$(elements);
      return $el.length > 0 && $el.is(":visible");
    });
  }

  /**
   * Checks if the popper is currently open
   * This is a shortcut to isTriggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popper is open
   */
  isOpened(): Cypress.Chainable<boolean> {
    return this.isTriggered();
  }

  /**
   * Checks if the popper is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popper is closed
   */
  isClosed(): Cypress.Chainable<boolean> {
    // Return a chainable that yields whether the popper is not visible
    return this.isOpened().then((isOpen) => !isOpen);
  }

  /**
   * Gets the content of the popper
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the content element of the popper
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Simply return the popper element using our get method
    // This ensures we use the correct selector based on the component name
    return this.get();
  }

  /**
   * Clicks on an element within the popper content by its data-testid
   * @param dataTestId - the data-testid of the element to click
   * @returns this - for method chaining
   */
  clickOnElement(dataTestId: string): this {
    this.getContent().find(`[data-testid="${dataTestId}"]`).click();
    return this;
  }
}

export default PopperInteractable;
