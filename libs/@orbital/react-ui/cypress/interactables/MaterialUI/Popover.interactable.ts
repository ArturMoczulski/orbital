import { MaterialUIInteractable } from "./MaterialUI.interactable";

/**
 * Interactable for Material UI Popover components
 * Provides methods to interact with popovers, dropdowns, and menus in Cypress tests
 */
export class PopoverInteractable extends MaterialUIInteractable {
  /**
   * Check if a popover/dropdown is currently open
   * @returns A chainable that resolves to true if the popover is open, false otherwise
   */
  isDropdownOpen(): Cypress.Chainable<boolean> {
    return PopoverInteractable.isDropdownOpen();
  }

  /**
   * Open a popover/dropdown by clicking on the trigger element
   * @returns A chainable that resolves when the popover is open
   */
  openDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().then(($el) => {
      return PopoverInteractable.openDropdown($el);
    });
  }

  /**
   * Close an open popover/dropdown
   * @returns A chainable that resolves when the popover is closed
   */
  closeDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    return PopoverInteractable.closeDropdown().then(() => {
      return this.get();
    });
  }

  /**
   * Check if a popover/dropdown is currently open
   * @returns A chainable that resolves to true if the popover is open, false otherwise
   */
  static isDropdownOpen(): Cypress.Chainable<boolean> {
    return MaterialUIInteractable.getFromBody(this.componentName()).then(
      ($el) => {
        return cy.wrap($el.length > 0);
      }
    );
  }

  /**
   * Open a popover/dropdown by clicking on the trigger element
   * @param element The element to click to open the popover
   * @returns A chainable that resolves when the popover is open
   */
  static openDropdown(
    element: JQuery<HTMLElement>
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    // Check if dropdown is already open
    return PopoverInteractable.isDropdownOpen().then((isOpen) => {
      if (!isOpen) {
        // Click directly on the combobox element which is what Material UI uses
        cy.wrap(element).find('[role="combobox"]').click({ force: true });

        // Wait for the dropdown to appear
        return cy
          .get("body")
          .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
          .should("be.visible");
      }

      // If already open, return the dropdown element
      return cy
        .get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root');
    });
  }

  /**
   * Close an open popover/dropdown
   * @returns A chainable that resolves when the popover is closed
   */
  static closeDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Check if dropdown is open
    return PopoverInteractable.isDropdownOpen().then((isOpen) => {
      if (isOpen) {
        // Click away to close the dropdown
        cy.get("body").click(0, 0);

        // Wait for the dropdown to disappear
        return cy
          .get("body")
          .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
          .should("not.exist");
      }

      // If already closed, return an empty element
      return cy.wrap(Cypress.$());
    });
  }
}

/**
 * Factory function to create a Popover interactable
 * @param componentType Optional component type identifier
 * @param parentElement Optional parent element to scope the component within
 * @returns A Popover interactable
 */
export function popover(
  options: {
    componentName?: string;
    dataTestId?: string;
    index?: number;
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>;
  } = {}
): PopoverInteractable {
  return new PopoverInteractable(options);
}

// Export the factory function and class
export default popover;
