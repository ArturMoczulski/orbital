import { Triggerable } from "./Triggerable";

/**
 * Interface for components that can be opened and closed
 * This interface extends Triggerable and defines methods for opening, closing,
 * and checking the state of openable components
 */
export interface Openable extends Triggerable {
  /**
   * Gets the trigger element that can be interacted with
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Opens the component
   * @returns this - for method chaining
   */
  open(): Cypress.Chainable<void>;

  /**
   * Closes the component
   * @returns this - for method chaining
   */
  close(): Cypress.Chainable<void>;

  /**
   * Checks if the component is currently open
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the component is open, false otherwise
   */
  isOpened(): Cypress.Chainable<boolean>;

  /**
   * Checks if the component is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the component is closed, false otherwise
   */
  isClosed(): Cypress.Chainable<boolean>;
}
