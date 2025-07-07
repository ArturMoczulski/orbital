/**
 * Interface for components that contain a list of selectable items
 * This interface defines methods for accessing and interacting with list items
 */
export interface Listable {
  /**
   * Gets a specific item from the list by its text content
   * @param text - The text content to search for
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the found item
   */
  item(text: string): Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Gets all items in the list
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to all items
   */
  items(): Cypress.Chainable<JQuery<HTMLElement>>;
}
