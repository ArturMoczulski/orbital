import { Openable } from "../interfaces/Openable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for ModalInteractable
 */
export interface ModalInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional trigger element selector or interactable
   * This is the element that opens the modal when clicked
   */
  triggerElement?: string | (() => Cypress.Chainable<JQuery<HTMLElement>>);
}

/**
 * Interactable for Material UI Modal components
 * Implements the Openable interface to provide methods for opening, closing,
 * and checking the state of the modal
 */
export class ModalInteractable
  extends MaterialUIInteractable
  implements Openable
{
  protected triggerElement?:
    | string
    | (() => Cypress.Chainable<JQuery<HTMLElement>>);

  constructor(options: ModalInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Modal",
    });
    this.triggerElement = options.triggerElement;
  }

  /**
   * Gets the trigger element that opens the modal
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    if (!this.triggerElement) {
      throw new Error("No trigger element provided for ModalInteractable");
    }

    if (typeof this.triggerElement === "string") {
      return cy.get(this.triggerElement);
    }

    return this.triggerElement();
  }

  /**
   * Triggers the modal by clicking the trigger element
   * @returns this - for method chaining
   */
  trigger(): this {
    // Click the trigger element to open the modal
    this.getTriggerElement().click();

    // Wait for the modal to be visible
    cy.wait(100); // Short wait for the modal to appear

    return this;
  }

  /**
   * Opens the modal by triggering it
   * Only opens if the modal is currently closed
   * @returns Cypress.Chainable<void> - for method chaining
   */
  open(): Cypress.Chainable<void> {
    // First check if it's closed
    return this.isClosed().then((closed) => {
      if (closed) {
        this.trigger();
      }

      // Return a chainable to satisfy TypeScript and maintain proper chaining
      return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
    });
  }

  /**
   * Closes the modal
   * Only closes if the modal is currently open
   * @returns Cypress.Chainable<void> - for method chaining
   */
  close(): Cypress.Chainable<void> {
    // First check if it's opened
    return this.isOpened().then((opened) => {
      if (opened) {
        // Press the ESC key to close the modal
        cy.get("body").type("{esc}");

        // Wait for animations to complete
        cy.wait(300);
      }

      // Return a chainable to satisfy TypeScript and maintain proper chaining
      return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
    });
  }

  /**
   * Checks if the modal is currently triggered/visible
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the modal is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    return cy.document().then(() => {
      // First check if the element exists at all using jQuery (synchronous)
      const $el = Cypress.$(this.selector());

      if ($el.length === 0) {
        // Element doesn't exist at all, modal is definitely closed
        return cy.wrap(false);
      }

      // Check multiple conditions that indicate a closed modal
      const isHidden = $el.css("display") === "none";
      const isAriaHidden = $el.attr("aria-hidden") === "true";
      const isNotVisible = !$el.is(":visible");

      // For debugging
      cy.log(
        `Modal state: hidden=${isHidden}, ariaHidden=${isAriaHidden}, visible=${!isNotVisible}`
      );

      // Modal is triggered/open if it exists, is visible, and not marked as hidden
      return cy.wrap(!isHidden && !isAriaHidden && !isNotVisible);
    });
  }

  /**
   * Checks if the modal is currently open
   * This is a shortcut to isTriggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the modal is open
   */
  isOpened(): Cypress.Chainable<boolean> {
    return this.isTriggered();
  }

  /**
   * Checks if the modal is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the modal is closed
   */
  isClosed(): Cypress.Chainable<boolean> {
    // Return a chainable that yields whether the modal is not visible
    return this.isOpened().then((isOpen) => !isOpen);
  }

  /**
   * Waits for the modal to close
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForClose(timeout: number = 4000): this {
    // Use a shorter timeout for tests
    const actualTimeout = Math.min(timeout, 100);
    // First check if modal is open, then decide what to do
    cy.wait(100); // Reduced wait time for faster tests
    this.isOpened().then((isOpen) => {
      if (isOpen) {
        // Only wait for it to close if it's currently open
        cy.log(`Waiting for modal to close: ${this.componentName}`);

        // Try to wait for the element to not exist
        try {
          // Use the shorter timeout for the get call
          this.get({ timeout: actualTimeout }).should("not.exist");
        } catch (e) {
          // If not.exist fails, check for display:none or aria-hidden
          // Use the shorter timeout for the get call
          this.get({ timeout: actualTimeout }).should("satisfy", ($el) => {
            return (
              $el.css("display") === "none" ||
              $el.attr("aria-hidden") === "true"
            );
          });
        }
      } else {
        cy.log(`Modal ${this.componentName} is already closed`);
      }
    });

    return this;
  }
}

/**
 * Helper function to create a ModalInteractable instance
 * @param options Optional configuration options for the ModalInteractable
 * @returns ModalInteractable instance
 */
export function modal(
  options?: Partial<ModalInteractableOptions>
): ModalInteractable {
  return new ModalInteractable({
    componentName: "Modal",
    ...options,
  });
}

export default ModalInteractable;
