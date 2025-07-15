import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for CircularProgressInteractable
 */
export interface CircularProgressInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional color of the CircularProgress (primary, secondary, error, info, success, warning, inherit)
   */
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "inherit";

  /**
   * Optional variant of the CircularProgress (determinate, indeterminate)
   */
  variant?: "determinate" | "indeterminate";
}

/**
 * Interactable for Material UI CircularProgress components
 * Provides methods for interacting with loading indicators in tests
 */
export class CircularProgressInteractable extends MaterialUIInteractable {
  protected color?: string;
  protected variant?: string;

  constructor(options: CircularProgressInteractableOptions = {}) {
    super({
      ...options,
      componentName: options.componentName || "CircularProgress",
    });
    this.color = options.color;
    this.variant = options.variant;
  }

  /**
   * Override selector to handle specific data-testid if provided
   */
  public override selector(): string {
    // If a specific data-testid is provided, use that
    if (this.dataTestId) {
      return `[data-testid="${this.dataTestId}"]`;
    }

    // Otherwise use the MUI class selector
    let selector = `.Mui${this.componentName}-root`;

    // Add color class if specified
    if (this.color) {
      selector += `.Mui${this.componentName}-color${this.color.charAt(0).toUpperCase() + this.color.slice(1)}`;
    }

    // Add variant class if specified
    if (this.variant) {
      selector += `.Mui${this.componentName}-${this.variant}`;
    }

    return selector;
  }

  /**
   * Checks if the loading indicator is visible
   * @returns this - for method chaining
   */
  isVisible(): this {
    this.get().should("be.visible");
    return this;
  }

  /**
   * Checks if the loading indicator is hidden
   * @returns this - for method chaining
   */
  isHidden(): this {
    // If using a data-testid selector, check the element directly
    if (this.dataTestId) {
      this.get().should("have.css", "display", "none");
      return this;
    }

    // For component name selectors, we need to check if the element is either:
    // 1. Hidden directly (display: none)
    // 2. Has a parent with display: none
    this.get().then(($el) => {
      // Check if the element itself is hidden
      const display = $el.css("display");
      if (display === "none") {
        return;
      }

      // Check if any parent has display: none
      let isHidden = false;
      let $parent = $el.parent();
      while ($parent.length && !isHidden) {
        if ($parent.css("display") === "none") {
          isHidden = true;
        }
        $parent = $parent.parent();
      }

      // Assert that either the element or one of its parents is hidden
      expect(isHidden).to.be.true;
    });

    return this;
  }

  /**
   * Waits for the loading indicator to appear
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForVisible(timeout: number = 5000): this {
    this.get({ timeout }).should("be.visible");
    return this;
  }

  /**
   * Waits for the loading indicator to disappear
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForHidden(timeout: number = 5000): this {
    // If using a data-testid selector, check the element directly
    if (this.dataTestId) {
      this.get({ timeout }).should("have.css", "display", "none");
      return this;
    }

    // For component name selectors, use the same logic as isHidden but with timeout
    this.get({ timeout }).then(($el) => {
      // Check if the element itself is hidden
      const display = $el.css("display");
      if (display === "none") {
        return;
      }

      // Check if any parent has display: none
      let isHidden = false;
      let $parent = $el.parent();
      while ($parent.length && !isHidden) {
        if ($parent.css("display") === "none") {
          isHidden = true;
        }
        $parent = $parent.parent();
      }

      // Assert that either the element or one of its parents is hidden
      expect(isHidden).to.be.true;
    });

    return this;
  }

  /**
   * Waits for the loading indicator to complete its operation
   * This is useful when you want to wait for an async operation to complete
   * @param timeout - maximum time to wait in milliseconds
   * @returns this - for method chaining
   */
  waitForCompletion(timeout: number = 10000): this {
    // First ensure it's visible (operation started)
    this.waitForVisible(timeout);

    // Then wait for it to be hidden (operation completed)
    this.waitForHidden(timeout);

    return this;
  }
}

/**
 * Helper function to create a CircularProgressInteractable instance
 * @param options Optional configuration options for the CircularProgressInteractable
 * @returns CircularProgressInteractable instance
 */
export function circularProgress(
  options?: Partial<CircularProgressInteractableOptions>
): CircularProgressInteractable {
  return new CircularProgressInteractable(options);
}

export default CircularProgressInteractable;
