/**
 * Abstract base class for Cypress component interactables
 * Provides common methods for interacting with components in tests
 */
export abstract class CypressInteractable<T extends string> {
  protected componentType: T;

  constructor(componentType: T) {
    this.componentType = componentType;
  }

  /**
   * Get the DOM element for this component
   * Default implementation looks for an element with data-testid="${componentType}"
   */
  getElement() {
    return cy.get(`[data-testid="${this.componentType}"]`).should("exist");
  }

  /**
   * Find a specific element within this component
   * This is a protected method that can be used by subclasses to find elements
   * Default implementation returns the component element itself
   */
  protected findElement() {
    return this.getElement();
  }

  /**
   * Click on this element
   */
  click(): this {
    this.findElement().click();
    return this;
  }

  /**
   * Hover over this element to show action buttons or tooltips
   */
  hover(): this {
    this.findElement().then(($el) => {
      // Use multiple hover events to ensure it triggers properly
      cy.wrap($el).trigger("mouseover", { force: true });
      cy.wrap($el).trigger("mouseenter", { force: true });
      cy.wrap($el).trigger("mousemove", { force: true });
    });
    return this;
  }
}
