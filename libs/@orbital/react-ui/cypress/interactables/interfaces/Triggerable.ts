/**
 * Interface for components that can be triggered by an element
 * This interface defines methods for getting and interacting with trigger elements
 */
export interface Triggerable {
  /**
   * Triggers the component by interacting with the trigger element
   * @returns this - for method chaining
   */
  trigger(): this;

  /**
   * Checks if the component is currently triggered
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the component is triggered, false otherwise
   */
  isTriggered(): Cypress.Chainable<boolean>;
}
