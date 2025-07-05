/**
 * Abstract base class for Cypress component interactables
 * Provides common methods for interacting with components in tests
 */
export abstract class CypressInteractable<T extends string> {
  protected componentType: T;
  protected parentElement?: Cypress.Chainable<JQuery<HTMLElement>>;

  constructor(
    componentType: T,
    parentElement?: Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    this.componentType = componentType;
    this.parentElement = parentElement;
  }

  /**
   * Get the DOM element for this component
   * Default implementation looks for an element with data-testid="${componentType}"
   * If useClassSelector is true, it looks for an element with class="${componentType}"
   * If a parent element is provided, the search is scoped to that element
   */
  getElement() {
    const selector = `[data-testid="${this.componentType}"]`;

    if (this.parentElement) {
      // Use find() instead of within() to maintain the context
      // This allows us to chain further find() calls without losing context
      return this.parentElement.get(selector).should("exist");
    }
    return cy.get(selector).should("exist");
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
