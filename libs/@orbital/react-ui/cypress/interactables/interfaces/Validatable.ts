/**
 * Interface for components that can be validated and display error states
 * This interface defines methods for checking and retrieving error states
 */
export interface Validatable {
  /**
   * Checks if the component is currently in an error state
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the component has an error
   */
  hasError(): Cypress.Chainable<boolean>;

  /**
   * Gets the error message displayed by the component
   * @returns Cypress.Chainable<string> - chainable that resolves to the error message text
   */
  getError(): Cypress.Chainable<string>;
}
