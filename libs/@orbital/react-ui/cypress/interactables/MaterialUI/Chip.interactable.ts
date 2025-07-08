import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Options for ChipInteractable
 */
export interface ChipInteractableOptions extends MaterialUIInteractableOptions {
  // Add any chip-specific options here
}

/**
 * Interactable for Material UI Chip component
 * @see https://mui.com/material-ui/react-chip/
 */
export class ChipInteractable extends MaterialUIInteractable {
  /**
   * Creates a new ChipInteractable
   * @param options The options for the chip interactable
   */
  constructor(options: ChipInteractableOptions | string) {
    // Handle string shorthand for data-testid
    const resolvedOptions: ChipInteractableOptions =
      typeof options === "string" ? { dataTestId: options } : options;

    super({
      ...resolvedOptions,
      componentName: resolvedOptions.componentName || "Chip",
    });
  }

  /**
   * Gets the label text of the chip
   * @returns A Cypress chainable containing the label text
   */
  label(): Cypress.Chainable<string> {
    return this.get().find(".MuiChip-label").invoke("text");
  }

  /**
   * Checks if the chip is deletable (has a delete icon)
   * @returns A Cypress chainable containing a boolean indicating if the chip is deletable
   */
  isDeletable(): Cypress.Chainable<boolean> {
    return this.get().then(($chip) => {
      // In Material UI, when onDelete is provided, it adds a CancelIcon with class MuiChip-deleteIcon
      // We need to check if this element exists within the chip
      return (
        $chip.find(".MuiChip-deleteIcon").length > 0 ||
        $chip.find("svg[data-testid='CancelIcon']").length > 0
      );
    });
  }

  /**
   * Deletes the chip by clicking the delete icon
   * @returns This interactable for chaining
   * @throws If the chip is not deletable
   */
  delete(): this {
    this.isDeletable().then((deletable) => {
      if (!deletable) {
        throw new Error("Cannot delete chip: no delete icon found");
      }

      this.get().find(".MuiChip-deleteIcon").click({ force: true });
    });

    return this;
  }

  /**
   * Clicks on the chip
   * @returns This interactable for chaining
   */
  click(): this {
    this.get().click();
    return this;
  }

  /**
   * Checks if the chip has a specific variant
   * @param variant The variant to check for (e.g., "filled", "outlined")
   * @returns A Cypress chainable containing a boolean indicating if the chip has the specified variant
   */
  hasVariant(variant: string): Cypress.Chainable<boolean> {
    return this.get().then(($el) => {
      if (variant === "outlined") {
        return $el.hasClass("MuiChip-outlined");
      } else if (variant === "filled") {
        return (
          $el.hasClass("MuiChip-filled") ||
          (!$el.hasClass("MuiChip-outlined") && $el.hasClass("MuiChip-root"))
        );
      }
      return false;
    });
  }

  /**
   * Checks if the chip has a specific color
   * @param color The color to check for (e.g., "primary", "secondary", "error")
   * @returns A Cypress chainable containing a boolean indicating if the chip has the specified color
   */
  hasColor(color: string): Cypress.Chainable<boolean> {
    return this.get().then(($el) => {
      return $el.hasClass(
        `MuiChip-color${color.charAt(0).toUpperCase() + color.slice(1)}`
      );
    });
  }

  /**
   * Checks if the chip is disabled
   * @returns A Cypress chainable containing a boolean indicating if the chip is disabled
   */
  isDisabled(): Cypress.Chainable<boolean> {
    return this.get().then(($el) => {
      return $el.hasClass("Mui-disabled");
    });
  }

  /**
   * Checks if the chip has an avatar
   * @returns A Cypress chainable containing a boolean indicating if the chip has an avatar
   */
  hasAvatar(): Cypress.Chainable<boolean> {
    return this.get().then(($chip) => {
      // In Material UI, when avatar is provided, it adds the MuiChip-avatar class
      // The avatar itself is an Avatar component with MuiAvatar-root class
      return (
        $chip.find(".MuiChip-avatar").length > 0 ||
        $chip.find(".MuiAvatar-root").length > 0
      );
    });
  }

  /**
   * Checks if the chip has an icon
   * @returns A Cypress chainable containing a boolean indicating if the chip has an icon
   */
  hasIcon(): Cypress.Chainable<boolean> {
    return this.get().then(($chip) => {
      // In Material UI, when icon is provided, it adds the MuiChip-icon class
      // In our test, we're using a mock icon with data-testid='mock-icon'
      return (
        $chip.find(".MuiChip-icon").length > 0 ||
        $chip.find("[data-testid='mock-icon']").length > 0 ||
        // Also check for any span element that might be the icon
        $chip.children("span").not(".MuiChip-label").length > 0
      );
    });
  }

  /**
   * Gets the size of the chip
   * @returns A Cypress chainable containing the size of the chip ("small", "medium", or undefined)
   */
  getSize(): Cypress.Chainable<string | undefined> {
    return cy.then(() => {
      return this.get().then(($el) => {
        if ($el.hasClass("MuiChip-sizeSmall")) {
          return "small";
        } else if (
          $el.hasClass("MuiChip-sizeMedium") ||
          $el.hasClass("MuiChip-root")
        ) {
          return "medium";
        }
        return undefined;
      });
    }) as unknown as Cypress.Chainable<string | undefined>;
  }
}
