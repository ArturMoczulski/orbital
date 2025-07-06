// MultiObjectSelector.interactable.ts
// This file provides a fluent API for interacting with MultiObjectSelector components in tests

/// <reference types="cypress" />

import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * Helper class to represent a selectable item in a MultiObjectSelector
 */
export class MultiObjectSelectorItem {
  private element: JQuery<HTMLElement>;
  private id: string;
  private name: string;
  private isChecked: boolean;

  constructor(element: JQuery<HTMLElement>) {
    this.element = element;
    this.id = element.attr("data-value-id") || "";
    this.name = element.text().trim();
    this.isChecked = element.find(".Mui-checked").length > 0;
  }

  /**
   * Get the ID of the item
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get the display name of the item
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if the item is currently selected
   */
  isSelected(): boolean {
    return this.isChecked;
  }

  /**
   * Click on the item to select or deselect it
   */
  click(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.wrap(this.element).click({ force: true });
  }
}

/**
 * MultiObjectSelectorInteractable class represents a MultiObjectSelector component
 * and provides methods for interacting with it.
 *
 * This handles the multi-select with checkboxes used in MultiObjectSelector.
 */
export class MultiObjectSelectorInteractable extends FormInputInteractable<
  string[]
> {
  /**
   * Constructor for MultiObjectSelectorInteractable
   * @param fieldName The name of the field
   * @param parentElement Optional parent element to scope the field within
   * @param dataTestId Optional data-testid to use for selecting elements
   */
  constructor(
    fieldName: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    private dataTestId: string = "MultiObjectSelector"
  ) {
    super(fieldName, parentElement);
  }

  /**
   * Override the selector method to target the component
   * This looks for a select field with the given name and data-testid
   */
  override selector() {
    return [
      `[data-testid="${this.dataTestId}"][data-field-name="${this.fieldName}"]`,
      `[data-field-name="${this.fieldName}"][role="combobox"]`,
    ].join(", ");
  }

  /**
   * Open the dropdown menu
   * @returns A chainable that resolves when the dropdown is open
   */
  openDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.log(
      `Opening dropdown for ${this.fieldName} with testId ${this.dataTestId}`
    );

    // Debug: Log the HTML structure to see what we're working with
    cy.get(
      `[data-testid="${this.dataTestId}"][data-field-name="${this.fieldName}"]`
    ).then(($el) => {
      cy.log(`Found element: ${$el.length > 0 ? "Yes" : "No"}`);
      cy.log(`Element HTML: ${$el.prop("outerHTML")}`);

      // Find the combobox element inside
      const $combobox = $el.find('[role="combobox"]');
      cy.log(`Combobox found: ${$combobox.length > 0 ? "Yes" : "No"}`);
      if ($combobox.length > 0) {
        cy.log(`Combobox HTML: ${$combobox.prop("outerHTML")}`);
      }
    });

    // Click directly on the combobox element which is what Material UI uses for the Select
    cy.get(
      `[data-testid="${this.dataTestId}"][data-field-name="${this.fieldName}"]`
    )
      .find('[role="combobox"]')
      .click({ force: true });

    // Material UI creates a portal outside the component tree for the dropdown
    // Wait for any dropdown to appear - try multiple selectors
    cy.log("Waiting for dropdown to appear...");

    // Use a more general selector that should work with Material UI Select
    return cy
      .get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .should("be.visible")
      .then(($popover) => {
        cy.log(`Dropdown found: ${$popover.length > 0 ? "Yes" : "No"}`);
        if ($popover.length > 0) {
          cy.log(`Dropdown HTML: ${$popover.prop("outerHTML")}`);
        }
        return cy.wrap($popover);
      });
  }

  /**
   * Close the dropdown menu
   * @returns A chainable that resolves when the dropdown is closed
   */
  closeDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Click away to close the dropdown
    cy.get("body").click(0, 0);
    return cy
      .get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .should("not.exist");
  }

  /**
   * Get all selectable items in the dropdown
   * @returns A chainable that resolves to an array of MultiObjectSelectorItem objects
   */
  getItems(): Cypress.Chainable<MultiObjectSelectorItem[]> {
    cy.log(`Getting items for ${this.fieldName}`);

    // Open the dropdown if it's not already open
    cy.get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .then(($popover) => {
        cy.log(
          `Dropdown exists before opening: ${$popover.length > 0 ? "Yes" : "No"}`
        );
        if ($popover.length === 0) {
          this.openDropdown();
        }
      });

    // Debug: Log the entire dropdown structure
    cy.get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .then(($popover) => {
        cy.log(
          `Dropdown HTML after ensuring open: ${$popover.prop("outerHTML")}`
        );

        // Try different selectors to find menu items
        const selectors = [
          `[data-testid="${this.dataTestId}-item"]`,
          ".MuiMenuItem-root",
          '[role="option"]',
          "li",
        ];

        selectors.forEach((selector) => {
          cy.log(
            `Items with selector "${selector}": ${$popover.find(selector).length}`
          );
          if ($popover.find(selector).length > 0) {
            $popover.find(selector).each((i, el) => {
              cy.log(
                `Item ${i} with selector "${selector}": ${Cypress.$(el).prop("outerHTML")}`
              );
            });
          }
        });
      });

    // Try to find menu items with multiple possible selectors
    return cy
      .get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .find('.MuiMenuItem-root, [role="option"], li')
      .then(($menuItems) => {
        cy.log(`Found ${$menuItems.length} menu items`);
        const items: MultiObjectSelectorItem[] = [];
        $menuItems.each((_, el) => {
          const item = new MultiObjectSelectorItem(Cypress.$(el));
          cy.log(
            `Item: id=${item.getId()}, name=${item.getName()}, selected=${item.isSelected()}`
          );
          items.push(item);
        });
        return cy.wrap(items);
      });
  }

  /**
   * Get only the selected items in the dropdown
   * @returns A chainable that resolves to an array of selected MultiObjectSelectorItem objects
   */
  getSelectedItems(): Cypress.Chainable<MultiObjectSelectorItem[]> {
    // Create an empty array with the correct type
    const emptyItems: MultiObjectSelectorItem[] = [];

    // Check if dropdown is already open
    return cy
      .get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .then(($popover) => {
        const isDropdownOpen = $popover.length > 0;

        if (isDropdownOpen) {
          // If dropdown is already open, get items directly
          return this.getItems().then((items) => {
            const selectedItems = items.filter((item) => item.isSelected());
            return cy.wrap(selectedItems);
          });
        } else {
          // If dropdown is closed, return empty array with correct type
          cy.log(
            "Dropdown is closed, can't get selected items. Use getSelectedValues() instead."
          );
          return cy.wrap(emptyItems);
        }
      });
  }

  /**
   * Get the IDs of the selected items
   * @returns A chainable that resolves to an array of selected item IDs
   */
  getSelectedValues(): Cypress.Chainable<string[]> {
    cy.log(`Getting selected values for ${this.fieldName}`);

    // Get the value directly from the native input element
    return this.getElement().then(($el) => {
      // Try to get the value from the native input
      const value = $el.find("input.MuiSelect-nativeInput").val();

      if (value) {
        const selectedIds = value
          .toString()
          .split(",")
          .filter((id) => id.trim() !== "");
        cy.log(
          `Got selected values from native input: ${selectedIds.join(", ") || "empty array"}`
        );
        return cy.wrap(selectedIds);
      }

      // Check if the combobox is empty (no text content)
      const comboboxText = $el.find('[role="combobox"]').text().trim();
      if (!comboboxText || comboboxText === "" || comboboxText === "​") {
        cy.log("Combobox is empty, returning empty array");
        return cy.wrap([] as string[]);
      }

      // If no value in the native input, check for selected chips in the UI
      const chips = $el.find(".MuiChip-root");
      const selectedIds: string[] = [];

      if (chips.length > 0) {
        cy.log(`Found ${chips.length} selected chips in the UI`);

        chips.each((_, chip) => {
          const chipEl = Cypress.$(chip);
          const dataValue =
            chipEl.attr("data-value") || chipEl.attr("data-tag-value");
          if (dataValue) {
            selectedIds.push(dataValue);
            cy.log(`Found chip with value: ${dataValue}`);
          }
        });

        if (selectedIds.length > 0) {
          return cy.wrap(selectedIds);
        }
      }

      // Check if dropdown is already open before trying to open it
      return cy
        .get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .then(($popover) => {
          const isDropdownOpen = $popover.length > 0;

          // If dropdown is not open and we still don't have values,
          // we can assume there are no selections (since we already checked the input and combobox)
          if (!isDropdownOpen) {
            cy.log(
              "Dropdown is not open and no values found, returning empty array"
            );
            return cy.wrap([] as string[]);
          }

          // If dropdown is already open, check for selected items
          return this.getItems().then((items) => {
            const selectedItems = items.filter((item) => item.isSelected());
            const selectedIds = selectedItems.map((item) => item.getId());

            cy.log(
              `Found ${selectedIds.length} selected items in dropdown: ${selectedIds.join(", ") || "empty array"}`
            );
            return cy.wrap(selectedIds);
          });
        });
    });
  }

  /**
   * Get a specific item by ID
   * @param id The ID of the item to find
   * @returns A chainable that resolves to the item or undefined if not found
   */
  getItemById(
    id: string
  ): Cypress.Chainable<MultiObjectSelectorItem | undefined> {
    return this.getItems().then((items) => {
      const foundItem = items.find((item) => item.getId() === id);
      return cy.wrap(foundItem || undefined);
    });
  }

  /**
   * Get a specific item by name
   * @param name The name of the item to find
   * @returns A chainable that resolves to the item or undefined if not found
   */
  getItemByName(
    name: string
  ): Cypress.Chainable<MultiObjectSelectorItem | undefined> {
    return this.getItems().then((items) => {
      const foundItem = items.find((item) => item.getName().includes(name));
      return cy.wrap(foundItem || undefined);
    });
  }

  /**
   * Set a value on the multi object selector by selecting multiple options by ID
   * @param values Array of IDs to select
   */
  selectById(values: string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.log(
      `MultiObjectSelectorInteractable.selectById called with values:`,
      JSON.stringify(values)
    );

    // Get the element
    const element = this.getElement();

    // Open the dropdown
    this.openDropdown();

    // Get all items
    return this.getItems().then((items) => {
      // First, clear any existing selections by clicking on each checked item
      items.forEach((item) => {
        if (item.isSelected()) {
          item.click();
        }
      });

      // Now select each value if there are any to select
      if (values && values.length > 0) {
        values.forEach((value) => {
          cy.log(`Selecting value: ${value}`);

          // Find the item by ID or name
          const item = items.find(
            (item) => item.getId() === value || item.getName().includes(value)
          );

          if (item) {
            item.click();
          } else {
            cy.log(`Warning: Could not find item with ID or name: ${value}`);
          }
        });
      } else {
        cy.log(
          "No values to select, all existing selections have been cleared"
        );
      }

      // Close the dropdown
      this.closeDropdown();

      return element;
    });
  }

  /**
   * Set values on the multi object selector
   * @param values Array of values to select
   */
  setValue(values: string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectById(values);
  }

  /**
   * Get the currently selected values
   */
  getValue(): Cypress.Chainable<string[]> {
    // We can use our new getSelectedValues method which is more reliable
    // than trying to get the value from the element directly
    return this.getSelectedValues();
  }

  /**
   * Check if the field is in error state
   */
  hasError(): Cypress.Chainable<boolean> {
    // For Material-UI, the error class is on the FormControl
    return this.getElement().then(($el) => {
      // Check if the element itself has the error class
      if ($el.hasClass("Mui-error")) {
        return cy.wrap(true);
      }

      // Check if any parent elements have the error class
      const $parent = $el.closest(".MuiFormControl-root");
      if ($parent.hasClass("Mui-error")) {
        return cy.wrap(true);
      }

      // Check if any child elements have the error class
      return cy.wrap($el.find(".Mui-error").length > 0);
    });
  }

  /**
   * Get the error message if any
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.getElement()
      .closest(".MuiFormControl-root")
      .find(".MuiFormHelperText-root")
      .invoke("text");
  }
}

/**
 * Factory function to create a MultiObjectSelector interactable
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @param dataTestId Optional data-testid to use for selecting elements
 * @returns A MultiObjectSelector interactable
 */
export function multiObjectSelector(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  dataTestId?: string
): MultiObjectSelectorInteractable {
  return new MultiObjectSelectorInteractable(
    fieldName,
    parentElement,
    dataTestId
  );
}

// Export the factory function and class
export default multiObjectSelector;
