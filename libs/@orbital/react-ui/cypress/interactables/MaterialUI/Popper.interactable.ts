import { Openable } from "../interfaces/Openable";
import { Triggerable } from "../interfaces/Triggerable";
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
  implements Openable, Triggerable
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
  close(): this {
    // For Material UI poppers, we need to click outside of it
    // to properly trigger the onClose handler if one exists

    // Try multiple strategies to ensure the popper closes
    cy.get("body").then(($body) => {
      // Strategy 1: Click away from the popper (top-left corner)
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
   * Checks if the popper is currently triggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the popper is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    // For Material UI poppers, we check if the element exists in the DOM
    // and is visible
    return cy.document().then((doc) => {
      // First check for Popper root elements using the rootSelector
      const popperElements = doc.querySelectorAll(this.rootSelector);

      // If we found any popper elements, check if they're visible
      if (popperElements.length > 0) {
        for (let i = 0; i < popperElements.length; i++) {
          const element = popperElements[i] as HTMLElement;
          // Check if the element is in the DOM and visible
          if (element.offsetParent !== null) {
            return true;
          }
        }
      }

      // If we didn't find any visible popper elements, check for the paper element
      // that's often inside a popper
      const paperElements = doc.querySelectorAll(".MuiPaper-root");
      if (paperElements.length > 0) {
        for (let i = 0; i < paperElements.length; i++) {
          const element = paperElements[i] as HTMLElement;
          // Check if the element is in the DOM, visible, and not part of another component
          if (
            element.offsetParent !== null &&
            !element.closest(".MuiDialog-root") &&
            !element.closest(".MuiPopover-root")
          ) {
            return true;
          }
        }
      }

      return false;
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
    // Find the popper content using the get method from the base class
    // This ensures we use the correct selector based on the component name

    // First try to find the element using our get method
    return this.get().then(($el) => {
      if ($el.length > 0) {
        return cy.wrap($el);
      }

      // If no popper found, look for paper elements that might be in a popper
      return cy
        .get(".MuiPaper-root:not(.MuiDialog-paper):not(.MuiPopover-paper)")
        .then(($papers) => {
          if ($papers.length > 0) {
            return cy.wrap($papers.eq(0));
          }

          // If still nothing found, return an empty div wrapped in jQuery
          // This ensures we always return a JQuery<HTMLElement>
          return cy.wrap(Cypress.$("<div>"));
        });
    });
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
