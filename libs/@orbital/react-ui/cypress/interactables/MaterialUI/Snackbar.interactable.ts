import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for SnackbarInteractable
 */
export interface SnackbarInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional variant of the snackbar (success, error, warning, info, default)
   */
  variant?: "success" | "error" | "warning" | "info" | "default";
}

/**
 * Interactable for notistack Snackbar components
 * Provides methods for interacting with notifications in tests
 */
export class SnackbarInteractable extends MaterialUIInteractable {
  protected variant?: string;

  constructor(options: SnackbarInteractableOptions = {}) {
    super({
      ...options,
      componentName: options.componentName || "Snackbar",
    });
    this.variant = options.variant;
  }

  /**
   * Override selector to handle notistack's specific class structure
   * notistack uses classes like .notistack-MuiContent-success
   */
  public override selector(): string {
    if (this.variant) {
      return `.notistack-MuiContent-${this.variant}`;
    }

    // If no variant is specified, select any notistack notification
    return `.notistack-MuiContent`;
  }

  /**
   * Gets all notifications currently visible
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - all notification elements
   */
  getAll(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`.notistack-MuiContent`);
  }

  /**
   * Gets notifications of a specific variant
   * @param variant - the variant to filter by (success, error, warning, info, default)
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - notification elements of the specified variant
   */
  getByVariant(
    variant: "success" | "error" | "warning" | "info" | "default"
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`.notistack-MuiContent-${variant}`);
  }

  /**
   * Gets the content/message of the notification
   * @returns Cypress.Chainable<string> - the text content of the notification
   */
  getMessage(): Cypress.Chainable<string> {
    return this.get().invoke("text");
  }

  /**
   * Checks if any notification is currently visible
   * @returns Cypress.Chainable<boolean> - true if any notification is visible
   */
  isVisible(): Cypress.Chainable<boolean> {
    return cy.document().then(() => {
      const $el = Cypress.$(`.notistack-MuiContent`);
      return cy.wrap($el.length > 0);
    });
  }

  /**
   * Checks if a notification with specific text is visible
   * @param text - the text to look for in notifications
   * @returns Cypress.Chainable<boolean> - true if a notification with the text is visible
   */
  containsMessage(text: string): Cypress.Chainable<boolean> {
    return this.getAll().then(($elements) => {
      for (let i = 0; i < $elements.length; i++) {
        if ($elements.eq(i).text().includes(text)) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Waits for a notification with specific text to appear
   * @param text - the text to wait for
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForMessage(text: string, timeout: number = 5000): this {
    cy.get(`.notistack-MuiContent`, { timeout }).should("contain", text);
    return this;
  }

  /**
   * Closes a notification by clicking its close button
   * If multiple notifications are visible, closes the first one that matches the variant
   * @returns this - for method chaining
   */
  /**
   * Attempts to close a notification by clicking its close button if available
   * Note: Not all notistack configurations include close buttons
   * @returns this - for method chaining
   */
  close(): this {
    // Try different selectors that might be used for close buttons
    this.get().then(($el) => {
      // Try common close button selectors
      const selectors = [
        '[aria-label="Close"]',
        ".MuiIconButton-root",
        ".notistack-MuiSnackbarContent-action button",
        ".notistack-SnackbarContent-action button",
      ];

      for (const selector of selectors) {
        if ($el.find(selector).length > 0) {
          cy.wrap($el).find(selector).first().click();
          return;
        }
      }

      // If no close button is found, log a warning
      cy.log(
        "No close button found for notification. Consider using waitForAllToClose() instead."
      );
    });

    return this;
  }

  /**
   * Waits for all notifications to disappear
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForAllToClose(timeout: number = 5000): this {
    cy.get(`.notistack-MuiContent`, { timeout }).should("not.exist");
    return this;
  }
}

/**
 * Helper function to create a SnackbarInteractable instance
 * @param options Optional configuration options for the SnackbarInteractable
 * @returns SnackbarInteractable instance
 */
export function snackbar(
  options?: Partial<SnackbarInteractableOptions>
): SnackbarInteractable {
  return new SnackbarInteractable(options);
}

export default SnackbarInteractable;
