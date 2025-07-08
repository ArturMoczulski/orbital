/**
 * Interface for components that can display a loading state
 * This interface defines methods for checking if a component is in a loading state
 */
export interface Loadable {
  /**
   * Checks if the component is currently in a loading state
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the component is loading
   */
  isLoading(): Cypress.Chainable<boolean>;
}
