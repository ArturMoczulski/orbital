import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";

const MUI_ROOT_CLASS_REGEX = /\bMui([A-Za-z0-9]+)-root\b/;

/**
 * Options for MaterialUIInteractable
 */
export interface MaterialUIInteractableOptions
  extends CypressInteractableOptions {
  /**
   * Optional componentName to bypass auto-discovery.
   * Example: for .MuiButton-root, componentName should be "Button".
   */
  componentName?: string;
}

/**
 * Base class for Material UI component interactables.
 * Provides common methods for interacting with Material UI components in tests.
 */
export class MaterialUIInteractable extends CypressInteractable {
  /** Cached component name suffix (e.g. "Button"). */
  protected componentName?: string;

  constructor(options: MaterialUIInteractableOptions) {
    super(options);
    this.componentName = options.componentName;
  }

  protected override validateTarget(): boolean {
    if (!this.componentName && !this.dataTestId) {
      throw new Error(
        "MaterialUIInteracbale: At least one of componentName or dataTestId must be provided"
      );
    }

    return true;
  }

  /**
   * Override get(): auto-discovers componentName on first call if missing.
   */
  /**
   * Override get(): auto-discovers componentName on first call if missing.
   * Accepts the same options object as Cypress.get().
   */
  public override get(
    options?: Partial<Cypress.Loggable & Cypress.Timeoutable>
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    if (!this.componentName && this.dataTestId) {
      return this.discoverComponentName().then(() => super.get(options));
    }
    return super.get(options);
  }

  /**
   * Retrieves and caches the componentName suffix.
   * @returns Chainable resolving to the componentName.
   */
  public discoverComponentName(): Cypress.Chainable<string> {
    if (this.componentName) {
      return cy.wrap(this.componentName);
    }

    // Store the original selector method
    const originalSelector = this.selector;

    // Temporarily override the selector method to use the parent class's selector
    // This avoids the circular dependency where our selector() needs componentName
    // but we're trying to discover componentName
    this.selector = CypressInteractable.prototype.selector;

    // Use the temporary selector to get the element
    return super.get().then(($el) => {
      // Restore the original selector method immediately
      this.selector = originalSelector.bind(this);

      // Try to find MUI class in the element itself
      const selfMatch = $el.attr("class")?.match(MUI_ROOT_CLASS_REGEX);
      if (selfMatch) {
        this.componentName = selfMatch[1];
        return this.componentName;
      }

      // If not found in element itself, look for it in parent elements
      const $parent = $el.closest('[class*="Mui"][class*="-root"]');
      const parentMatch = $parent.attr("class")?.match(MUI_ROOT_CLASS_REGEX);

      if (parentMatch) {
        this.componentName = parentMatch[1];
        return this.componentName;
      }

      throw new Error(
        `MaterialUIInteractable: Unable to auto-discover MUI root for ${this.constructor.name}`
      );
    });
  }

  /**
   * Builds the CSS selector for the root element.
   */
  public get rootSelector(): string {
    if (!this.componentName) {
      throw new Error(
        `MaterialUIInteractable: componentName undefined when building selector in ${this.constructor.name}`
      );
    }
    return `.Mui${this.componentName}-root`;
  }

  /**
   * Override to use MUI root class and optional data-testid.
   */
  public override selector(): string {
    const idSel = this.dataTestId ? `[data-testid="${this.dataTestId}"]` : "";
    const rootSel = this.rootSelector;
    return `${rootSel}${idSel}`;
  }

  /**
   * Static helper to select a component from the document body.
   */
  public static getFromBody(
    componentName: string
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("body").find(MaterialUIInteractable.root(componentName));
  }

  /**
   * Build a root selector for any MUI component suffix.
   * Example: MaterialUIInteractable.root("Button") => ".MuiButton-root"
   */
  public static root(componentSuffix: string): string {
    return `.Mui${componentSuffix}-root`;
  }
}

export default MaterialUIInteractable;
