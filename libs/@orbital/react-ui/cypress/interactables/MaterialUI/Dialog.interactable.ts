import { Openable } from "../interfaces/Openable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for DialogInteractable
 */
export interface DialogInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional trigger element selector or interactable
   * This is the element that opens the dialog when clicked
   */
  triggerElement?: string | (() => Cypress.Chainable<JQuery<HTMLElement>>);
}

/**
 * Interactable for Material UI Dialog components
 * Implements the Openable interface to provide methods for opening, closing,
 * and checking the state of the dialog
 */
export class DialogInteractable
  extends MaterialUIInteractable
  implements Openable
{
  protected triggerElement?:
    | string
    | (() => Cypress.Chainable<JQuery<HTMLElement>>);

  constructor(options: DialogInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Dialog",
    });
    this.triggerElement = options.triggerElement;
  }

  /**
   * Gets the trigger element that opens the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    if (!this.triggerElement) {
      throw new Error("No trigger element provided for DialogInteractable");
    }

    if (typeof this.triggerElement === "string") {
      return cy.get(this.triggerElement);
    }

    return this.triggerElement();
  }

  /**
   * Triggers the dialog by clicking the trigger element
   * @returns this - for method chaining
   */
  trigger(): this {
    // Click the trigger element to open the dialog
    this.getTriggerElement().click();

    // Wait for the dialog to be visible
    cy.wait(100); // Short wait for the dialog to appear

    return this;
  }

  /**
   * Opens the dialog by triggering it
   * Only opens if the dialog is currently closed
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
   * Closes the dialog
   * Only closes if the dialog is currently open
   * @returns Cypress.Chainable<void> - for method chaining
   */
  close(): Cypress.Chainable<void> {
    // First check if it's opened
    return this.isOpened().then((opened) => {
      if (opened) {
        // For Material UI dialogs, we can try multiple approaches:

        // 1. Click the close button if it exists (common in dialogs)
        // Try to click the close button, but don't fail if it doesn't exist
        this.get({})
          .find('[aria-label="close"]')
          .then(($closeBtn) => {
            if ($closeBtn.length > 0) {
              cy.wrap($closeBtn).click({ force: true });
            } else {
              // If close button doesn't exist, click outside
              cy.get("body").click(10, 10);
            }
          });

        // 2. Press Escape key as a fallback
        cy.get("body").type("{esc}");

        // Wait for animations to complete
        cy.wait(100);
      }

      // Return a chainable to satisfy TypeScript and maintain proper chaining
      return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
    });
  }

  /**
   * Checks if the dialog is currently triggered/visible
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the dialog is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    // Check if the element exists in the DOM
    if (!this.exists()) {
      return cy.wrap(false);
    }

    // For dialogs, we also need to check if it's visible (not hidden)
    return this.get({})
      .should("exist")
      .then(($el) => {
        return (
          $el.css("display") !== "none" && $el.attr("aria-hidden") !== "true"
        );
      });
  }

  /**
   * Checks if the dialog is currently open
   * This is a shortcut to isTriggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the dialog is open
   */
  isOpened(): Cypress.Chainable<boolean> {
    return this.isTriggered();
  }

  /**
   * Checks if the dialog is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the dialog is closed
   */
  isClosed(): Cypress.Chainable<boolean> {
    // Return a chainable that yields whether the dialog is not visible
    return this.isOpened().then((isOpen) => !isOpen);
  }

  /**
   * Gets the content of the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the content element of the dialog
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get({}).find(".MuiDialogContent-root");
  }

  /**
   * Gets the title of the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the title element of the dialog
   */
  getTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get({}).find(".MuiDialogTitle-root");
  }

  /**
   * Gets the actions section of the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the actions element of the dialog
   */
  getActions(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get({}).find(".MuiDialogActions-root");
  }

  /**
   * Clicks on an element within the dialog by its data-testid
   * @param dataTestId - the data-testid of the element to click
   * @returns this - for method chaining
   */
  clickOnElement(dataTestId: string): this {
    this.get({}).find(`[data-testid="${dataTestId}"]`).click();
    return this;
  }

  /**
   * Waits for the dialog to close
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForClose(timeout: number = 4000): this {
    // First check if dialog is open, then decide what to do
    cy.wait(500);
    this.isOpened().then((isOpen) => {
      if (isOpen) {
        // Only wait for it to close if it's currently open
        cy.log(`Waiting for dialog to close: ${this.componentName}`);

        // Try to wait for the element to not exist
        try {
          this.get({ timeout }).should("not.exist");
        } catch (e) {
          // If not.exist fails, check for display:none or aria-hidden
          this.get({ timeout }).should("satisfy", ($el) => {
            return (
              $el.css("display") === "none" ||
              $el.attr("aria-hidden") === "true"
            );
          });
        }
      } else {
        cy.log(`Dialog ${this.componentName} is already closed`);
      }
    });

    return this;
  }
}

export default DialogInteractable;
