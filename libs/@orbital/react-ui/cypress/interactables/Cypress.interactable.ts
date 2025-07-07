/**
 * Abstract base class for Cypress component interactables
 * Provides common methods for interacting with components in tests
 */

export interface CypressInteractableOptions {
  htmlElementType?: string;
  dataTestId?: string;
  index?: number;
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>;
}

export abstract class CypressInteractable {
  protected htmlElementType?: string;
  protected dataTestId?: string;
  protected index?: number;
  protected parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>;

  static componentName(): string {
    return this.constructor.name.replace(/Interactable/, "");
  }

  constructor(options: CypressInteractableOptions = {}) {
    this.htmlElementType = options.htmlElementType;
    this.dataTestId = options.dataTestId;
    this.index = options.index;
    this.parentElement = options.parentElement;
  }

  selector() {
    if (this.htmlElementType && this.dataTestId) {
      return `${this.htmlElementType}[data-testid="${this.dataTestId}"]`;
    }

    if (this.htmlElementType) {
      return `${this.htmlElementType}`;
    }

    if (this.dataTestId) {
      return `[data-testid="${this.dataTestId}"]`;
    }

    // This should never happen due to the validation in the constructor
    throw new Error("Not enough selectors to find components");
  }

  /**
   * Get the DOM element for this component
   * Default implementation looks for an element with data-testid="${componentType}"
   * If useClassSelector is true, it looks for an element with class="${componentType}"
   * If a parent element is provided, the search is scoped to that element
   * @param options Optional Cypress options for element retrieval (e.g., timeout)
   */
  get(
    options?: Partial<
      Cypress.Loggable &
        Cypress.Timeoutable &
        Cypress.Withinable &
        Cypress.Shadow
    >
  ) {
    if (!this.validateTarget()) {
      throw new Error(
        "CypressInteractable: At least one of htmlElementType or dataTestId must be provided"
      );
    }

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

        // Check if multiple elements were found and no index was provided
        if ($found.length > 1 && this.index === undefined) {
          throw new Error(
            `Multiple elements (${$found.length}) found matching selector "${this.selector()}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
          );
        }

        // If index is provided, return the element at that index
        if (this.index !== undefined && $found.length > 0) {
          if (this.index >= $found.length) {
            throw new Error(
              `Index ${this.index} is out of bounds. Only ${$found.length} elements found matching selector "${this.selector()}".`
            );
          }
          return cy.wrap($found.eq(this.index));
        }

        // Return a new chainable for the found element
        return cy.wrap($found);
      });
    }

    // If no parent element, use cy.get() directly with the provided options
    return cy.get(this.selector(), options).then(($elements) => {
      // Check if multiple elements were found and no index was provided
      if ($elements.length > 1 && this.index === undefined) {
        throw new Error(
          `Multiple elements (${$elements.length}) found matching selector "${this.selector()}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
        );
      }

      // If index is provided, return the element at that index
      if (this.index !== undefined && $elements.length > 0) {
        if (this.index >= $elements.length) {
          throw new Error(
            `Index ${this.index} is out of bounds. Only ${$elements.length} elements found matching selector "${this.selector()}".`
          );
        }
        return cy.wrap($elements.eq(this.index));
      }

      return cy.wrap($elements);
    });
  }

  /**
   * Validate provided options
   * Override in subclasses to customize validation logic
   */
  protected validateTarget(): boolean {
    if (!this.htmlElementType && !this.dataTestId) {
      throw new Error(
        "CypressInteractable: At least one of htmlElementType or dataTestId must be provided"
      );
    }
    return true;
  }

  /**
   * Click on this element
   */
  click(): this {
    this.get().click();
    return this;
  }

  /**
   * Hover over this element to show action buttons or tooltips
   */
  hover(): this {
    this.get().then(($el) => {
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
    this.get().should(chainer, value);

    // Return this for chaining
    return this as unknown as T;
  }
}
