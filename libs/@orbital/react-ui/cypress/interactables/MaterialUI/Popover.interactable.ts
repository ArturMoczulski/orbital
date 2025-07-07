import { Openable } from "../interfaces/Openable";
import { Triggerable } from "../interfaces/Triggerable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for PopoverInteractable
 */
export interface PopoverInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional trigger element selector or interactable
   * This is the element that opens the popover when clicked
   */
  triggerElement?: string | (() => Cypress.Chainable<JQuery<HTMLElement>>);
}

/**
 * Interactable for Material UI Popover components
 * Implements the Openable interface to provide methods for opening, closing,
 * and checking the state of the popover
 */
export class PopoverInteractable
  extends MaterialUIInteractable
  implements Openable, Triggerable
{
  protected triggerElement?:
    | string
    | (() => Cypress.Chainable<JQuery<HTMLElement>>);

  constructor(options: PopoverInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Popover",
    });
    this.triggerElement = options.triggerElement;
  }

  /**
   * Gets the trigger element that opens the popover
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    if (!this.triggerElement) {
      throw new Error("No trigger element provided for PopoverInteractable");
    }

    if (typeof this.triggerElement === "string") {
      return cy.get(this.triggerElement);
    }

    return this.triggerElement();
  }

  /**
   * Triggers the popover by clicking the trigger element
   * @returns this - for method chaining
   */
  trigger(): this {
    // Click the trigger element to open the popover
    this.getTriggerElement().click();

    // Wait for the popover to be visible
    this.should("be.visible", { timeout: 5000 });

    return this;
  }

  /**
   * Opens the popover by triggering it
   * This is a shortcut to the trigger method
   * @returns this - for method chaining
   */
  open(): this {
    return this.trigger();
  }

  /**
   * Closes the popover by clicking outside of it
   * @returns this - for method chaining
   */
  close(): this {
    // For Material UI popovers, we need to click on the backdrop or press Escape
    // to properly trigger the onClose handler

    // Try multiple strategies to ensure the popover closes
    cy.get("body").then(($body) => {
      // Strategy 1: Click away from the popover (top-left corner)
      cy.get("body").click(10, 10);

      // Strategy 2: Click in the center of the body
      cy.wait(100).then(() => {
        this.isOpened().then((isOpen) => {
          if (isOpen) {
            const bodyWidth = $body.width() || 500;
            const bodyHeight = $body.height() || 500;
            cy.get("body").click(bodyWidth / 2, bodyHeight / 2);
          }
        });
      });

      // Strategy 3: Press Escape key as a final fallback
      cy.wait(100).then(() => {
        this.isOpened().then((isOpen) => {
          if (isOpen) {
            cy.get("body").type("{esc}");
          }
        });
      });
    });

    // Wait for animations to complete
    cy.wait(300);

    return this;
  }

  /**
   * Checks if the popover is currently triggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popover is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    // For Material UI popovers, we check if the element exists in the DOM
    // since they are completely removed when closed
    return cy.document().then((doc) => {
      // First check for .MuiPopover-root elements
      const popoverElements = doc.querySelectorAll(".MuiPopover-root");

      // If we found any popover elements, check if they're visible
      if (popoverElements.length > 0) {
        for (let i = 0; i < popoverElements.length; i++) {
          const element = popoverElements[i] as HTMLElement;
          // Check if the element is in the DOM and visible
          if (element.offsetParent !== null) {
            return true;
          }
        }
      }

      // If we didn't find any visible popover elements, check for the paper element
      const paperElements = doc.querySelectorAll(".MuiPopover-paper");
      if (paperElements.length > 0) {
        for (let i = 0; i < paperElements.length; i++) {
          const element = paperElements[i] as HTMLElement;
          if (element.offsetParent !== null) {
            return true;
          }
        }
      }

      return false;
    });
  }

  /**
   * Checks if the popover is currently open
   * This is a shortcut to isTriggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popover is open
   */
  isOpened(): Cypress.Chainable<boolean> {
    return this.isTriggered();
  }

  /**
   * Checks if the popover is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popover is closed
   */
  isClosed(): Cypress.Chainable<boolean> {
    // Return a chainable that yields whether the popover is not visible
    return this.isOpened().then((isOpen) => !isOpen);
  }

  /**
   * Gets the content of the popover
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the content element of the popover
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Find the popover content using the popover element
    return this.get().find(".MuiPopover-paper");
  }

  /**
   * Clicks on an element within the popover content by its data-testid
   * @param dataTestId - the data-testid of the element to click
   * @returns this - for method chaining
   */
  clickOnElement(dataTestId: string): this {
    this.getContent().find(`[data-testid="${dataTestId}"]`).click();
    return this;
  }
}

export default PopoverInteractable;
