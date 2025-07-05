/**
 * Abstract base class for Cypress component interactables
 * Provides common methods for interacting with components in tests
 */
export abstract class CypressInteractable<T extends string> {
  protected componentType: T;
  protected parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>;

  constructor(
    componentType: T,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    this.componentType = componentType;
    this.parentElement = parentElement;
  }

  selector() {
    return `[data-testid="${this.componentType}"]`;
  }

  /**
   * Get the DOM element for this component
   * Default implementation looks for an element with data-testid="${componentType}"
   * If useClassSelector is true, it looks for an element with class="${componentType}"
   * If a parent element is provided, the search is scoped to that element
   */
  getElement() {
    if (this.parentElement && typeof this.parentElement != "function") {
      throw new Error(
        "parentElement must be a function that returns a Cypress.Chainable<JQuery<HTMLElement>>"
      );
    }

    if (this.parentElement && this.parentElement()) {
      // Return the result of finding the element within the parent
      return this.parentElement().then(($parent) => {
        // Find the element using jQuery's find()
        const $found = $parent.find(this.selector());

        // Return a new chainable for the found element
        return cy.wrap($found);
      });
    }

    // If no parent element, use cy.get() directly
    return cy.get(this.selector()).should("exist");
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

  /**
   * Proxy for Cypress's should method
   * This allows chaining should directly on the Interactable instance
   * @param chainer The chainer string (e.g., 'be.visible', 'exist')
   * @param value Optional value to check against
   */
  should<T = this>(chainer: string, value?: any): T {
    // Forward the should call to the element
    this.getElement().should(chainer, value);

    // Return this for chaining
    return this as unknown as T;
  }
}
