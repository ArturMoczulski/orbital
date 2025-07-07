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
    const rootSel = this.componentName ? this.rootSelector : "";
    return rootSel ? `${rootSel}${idSel}` : idSel;
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
