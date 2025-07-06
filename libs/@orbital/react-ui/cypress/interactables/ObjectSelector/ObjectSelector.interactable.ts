// ObjectSelector.interactable.ts
// This file provides a fluent API for interacting with ObjectSelector components in tests

/// <reference types="cypress" />

import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * Helper class to represent a selectable item in an ObjectSelector
 */
export class ObjectSelectorItem {
  private element: JQuery<HTMLElement>;
  private id: string;
  private objectType: string | undefined;
  private name: string;
  private isChecked: boolean;

  constructor(element: JQuery<HTMLElement>) {
    this.element = element;
    // For dropdown items/options, data-value-id is the identifier for the option value
    // data-object-id should not be used for option values
    this.id = element.attr("data-value-id") || "";
    this.objectType = element.attr("data-object-type");
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
   * Get the object type of the item if available
   */
  getObjectType(): string | undefined {
    return this.objectType;
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
 * ObjectSelectorInteractable class represents an ObjectSelector component
 * and provides methods for interacting with it
 */
export class ObjectSelectorInteractable extends FormInputInteractable<
  string | string[]
> {
  /**
   * Constructor for ObjectSelectorInteractable
   * @param fieldName The name of the field
   * @param parentElement Optional parent element to scope the field within
   * @param dataTestId Optional data-testid to use for selecting elements
   * @param multiple Whether this is a multi-select field
   * @param objectType Optional object type for data-object-type attribute
   */
  constructor(
    fieldName: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    private dataTestId: string = "ObjectSelector",
    private multiple: boolean = false,
    protected objectType?: string,
    protected objectId?: string,
    protected index?: number
  ) {
    super(fieldName, parentElement);
  }

  /**
   * Override getElement to handle the index parameter
   * If multiple elements match the selector and no index is provided, throw an error
   */
  override getElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    if (this.parentElement && typeof this.parentElement != "function") {
      throw new Error(
        "parentElement must be a function that returns a Cypress.Chainable<JQuery<HTMLElement>>"
      );
    }

    const selector = this.selector();

    if (this.parentElement && this.parentElement()) {
      // Return the result of finding the element within the parent
      return this.parentElement().then(($parent) => {
        // Find the element using jQuery's find()
        const $found = $parent.find(selector);

        // Check if multiple elements were found and no index was provided
        if ($found.length > 1 && this.index === undefined) {
          throw new Error(
            `Multiple elements (${$found.length}) found matching selector "${selector}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
          );
        }

        // If index is provided, return the element at that index
        if (this.index !== undefined && $found.length > 0) {
          if (this.index >= $found.length) {
            throw new Error(
              `Index ${this.index} is out of bounds. Only ${$found.length} elements found matching selector "${selector}".`
            );
          }
          return cy.wrap($found.eq(this.index));
        }

        // Return a new chainable for the found element
        return cy.wrap($found);
      });
    }

    // If no parent element, use cy.get() directly
    return cy.get(selector).then(($elements) => {
      // Check if multiple elements were found and no index was provided
      if ($elements.length > 1 && this.index === undefined) {
        throw new Error(
          `Multiple elements (${$elements.length}) found matching selector "${selector}" but no index parameter was provided to the interactable. Provide an index parameter to clarify which element to target.`
        );
      }

      // If index is provided, return the element at that index
      if (this.index !== undefined && $elements.length > 0) {
        if (this.index >= $elements.length) {
          throw new Error(
            `Index ${this.index} is out of bounds. Only ${$elements.length} elements found matching selector "${selector}".`
          );
        }
        return cy.wrap($elements.eq(this.index));
      }

      return cy.wrap($elements);
    });
  }

  /**
   * Get the component name from the class name
   * This removes "Interactable" from the end of the class name
   */
  protected getComponentName(): string {
    // Get the class name from the constructor
    const className = this.dataTestId;
    // Remove "Interactable" from the end
    return className.replace(/Interactable$/, "");
  }

  /**
   * Override the selector method to target the component
   * This looks for a select field with the given name and data-testid
   */
  override selector() {
    // If objectId is available, use the more specific selector
    if (this.objectId) {
      return `[data-testid="${this.dataTestId}"][data-field-name="${this.fieldName}"][data-object-id="${this.objectId}"]`;
    }

    // Otherwise use the standard selector with data-testid and data-field-name
    return `[data-testid="${this.dataTestId}"][data-field-name="${this.fieldName}"]`;
  }

  /**
   * Open the dropdown menu
   * @returns A chainable that resolves when the dropdown is open
   */
  openDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Use the same selector logic as the selector() method
    const element = this.getElement();

    // Click directly on the combobox element which is what Material UI uses for the Select
    element.find('[role="combobox"]').click({ force: true });

    // Material UI creates a portal outside the component tree for the dropdown
    // Wait for any dropdown to appear - try multiple selectors
    // Use a more general selector that should work with Material UI Select
    return cy
      .get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .should("be.visible");
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
   * @returns A chainable that resolves to an array of ObjectSelectorItem objects
   */
  getItems(): Cypress.Chainable<ObjectSelectorItem[]> {
    // Always open the dropdown first to ensure it's visible
    // This is more reliable than checking if it's already open
    return this.openDropdown().then(() => {
      // Try to find menu items with multiple possible selectors
      return cy
        .get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('.MuiMenuItem-root, [role="option"], li')
        .then(($menuItems) => {
          const items: ObjectSelectorItem[] = [];
          $menuItems.each((_, el) => {
            const item = new ObjectSelectorItem(Cypress.$(el));
            items.push(item);
          });
          return cy.wrap(items);
        });
    });
  }

  /**
   * Get only the selected items in the dropdown
   * @returns A chainable that resolves to an array of selected ObjectSelectorItem objects
   */
  getSelectedItems(): Cypress.Chainable<ObjectSelectorItem[]> {
    // Create an empty array with the correct type
    const emptyItems: ObjectSelectorItem[] = [];

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
          return cy.wrap(emptyItems);
        }
      });
  }

  /**
   * Get the IDs of the selected items
   * @returns A chainable that resolves to an array of selected item IDs
   */
  getSelectedValues(): Cypress.Chainable<string[]> {
    // Get the value directly from the native input element
    return this.getElement().then(($el) => {
      // Try to get the value from the native input
      const value = $el.find("input.MuiSelect-nativeInput").val();

      if (value) {
        if (this.multiple) {
          const selectedIds = value
            .toString()
            .split(",")
            .filter((id) => id.trim() !== "");
          return cy.wrap(selectedIds);
        } else {
          // For single select, return as array with one item for consistency
          return cy.wrap(value ? [value.toString()] : []);
        }
      }

      // Check if the combobox is empty (no text content)
      const comboboxText = $el.find('[role="combobox"]').text().trim();
      if (!comboboxText || comboboxText === "" || comboboxText === "​") {
        return cy.wrap([] as string[]);
      }

      // If no value in the native input, check for selected chips in the UI (for multiple mode)
      if (this.multiple) {
        const chips = $el.find(".MuiChip-root");
        const selectedIds: string[] = [];

        if (chips.length > 0) {
          chips.each((_, chip) => {
            const chipEl = Cypress.$(chip);
            const dataValue =
              chipEl.attr("data-value") || chipEl.attr("data-tag-value");
            if (dataValue) {
              selectedIds.push(dataValue);
            }
          });

          if (selectedIds.length > 0) {
            return cy.wrap(selectedIds);
          }
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
            return cy.wrap([] as string[]);
          }

          // If dropdown is already open, check for selected items
          return this.getItems().then((items) => {
            const selectedItems = items.filter((item) => item.isSelected());
            const selectedIds = selectedItems.map((item) => item.getId());
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
  getItemById(id: string): Cypress.Chainable<ObjectSelectorItem | undefined> {
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
  ): Cypress.Chainable<ObjectSelectorItem | undefined> {
    return this.getItems().then((items) => {
      const foundItem = items.find((item) => item.getName().includes(name));
      return cy.wrap(foundItem || undefined);
    });
  }

  /**
   * Set a value on the object selector by selecting option(s) by ID
   * @param value The value(s) to select (string for single mode, string[] for multiple mode)
   */
  selectById(value: string | string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element
    const element = this.getElement();

    // Open the dropdown
    this.openDropdown();

    if (this.multiple) {
      // For multiple mode
      const values = Array.isArray(value) ? value : [value];

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
          values.forEach((val) => {
            // Find the item by ID or name
            const item = items.find(
              (item) => item.getId() === val || item.getName().includes(val)
            );

            if (item) {
              item.click();
            }
          });
        }

        // Close the dropdown
        this.closeDropdown();
        return element;
      });
    } else {
      // For single mode
      const val = Array.isArray(value) ? value[0] : value;

      // If value is empty, select the "None" option
      if (!val) {
        cy.get("body")
          .find(
            `[data-testid="${this.dataTestId}-none"][data-field-name="${this.fieldName}"]`
          )
          .click();
      } else {
        // Define the selector for finding options
        const selector = `[data-testid="${this.dataTestId}-item"][data-field-name="${this.fieldName}"]`;

        // Find the option with the given value using the data attributes
        cy.get("body")
          .find(selector)
          // In the dropdown items, we should only use data-value-id for option values
          .filter(`[data-value-id="${val}"]`)
          .click();
      }

      // Close the dropdown
      this.closeDropdown();
      return element;
    }
  }

  /**
   * Select an option by its display text
   * @param displayText The text displayed in the option
   */
  selectByText(displayText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element and open the dropdown
    const element = this.getElement();
    this.openDropdown();

    // Find the option with the given display text
    cy.get("body")
      .find(
        `[data-testid="${this.dataTestId}-item"][data-field-name="${this.fieldName}"]`
      )
      .contains(displayText)
      .click();

    // Close the dropdown if in single mode
    if (!this.multiple) {
      this.closeDropdown();
    }

    return element;
  }

  /**
   * Set value(s) on the object selector
   * @param value The value(s) to select (string for single mode, string[] for multiple mode)
   */
  setValue(value: string | string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectById(value);
  }

  /**
   * Get the currently selected value(s)
   * @returns A chainable that resolves to the selected value (string for single mode) or values (string[] for multiple mode)
   */
  getValue(): Cypress.Chainable<any> {
    if (this.multiple) {
      return this.getSelectedValues() as Cypress.Chainable<string[]>;
    } else {
      return this.getSelectedValues().then((values) => {
        return cy.wrap(
          values.length > 0 ? values[0] : ""
        ) as Cypress.Chainable<string>;
      });
    }
  }

  /**
   * Get the currently selected option's text
   */
  getSelectedText(): Cypress.Chainable<string> {
    // First get the current value (ID)
    return this.getValue().then((value: string | string[]) => {
      // If no value is selected, return empty string
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return cy.wrap("");
      }

      // Get the ID we need to look up
      const id = Array.isArray(value) ? value[0] : value;

      // Try to get the text directly from the UI first
      return this.getElement().then(($el) => {
        // First try the standard MuiSelect-select class
        const $selectText = $el.find(".MuiSelect-select, [role=button]");
        if ($selectText.length > 0 && $selectText.text().trim() !== "") {
          const text = $selectText.first().text().trim();
          if (text && text !== "​" && text !== "\u200B") {
            // Check for zero-width space
            return cy.wrap(text);
          }
        }

        // For TextField with select=true, try the input element
        const $input = $el.find(".MuiInputBase-input");
        if ($input.length > 0 && $input.first().val()) {
          const inputVal = $input.first().val();
          if (inputVal) {
            return cy.wrap(typeof inputVal === "string" ? inputVal : "");
          }
        }

        // Try to find any data-* attributes that might contain display text
        // Look for elements with data-value-id within the component
        const $element = $el.find(`[data-value-id="${id}"]`);
        if ($element.length > 0) {
          // Check for any data attributes that might contain display text
          const dataAttrs = [
            "data-display-text",
            "data-text",
            "data-label",
            "data-name",
          ];
          for (const attr of dataAttrs) {
            const displayText = $element.attr(attr);
            if (displayText) {
              return cy.wrap(displayText);
            }
          }
        }

        // Check if the field is disabled
        return this.isDisabled().then((isDisabled) => {
          if (isDisabled) {
            // For disabled fields, we can't open the dropdown
            // Look for data attributes that might contain display information
            // For disabled fields, look for elements with data-display-text and data-value-id
            // data-value-id is used for option values within the component
            const $optionDisplay = $el.find(
              `[data-display-text][data-value-id="${id}"]`
            );
            if ($optionDisplay.length > 0) {
              const displayText = $optionDisplay.attr("data-display-text");
              if (displayText) {
                return cy.wrap(displayText);
              }
            }

            // If we can't find the display text for a disabled field, return the ID
            return cy.wrap(id || "");
          }

          // If the field is not disabled, try to open the dropdown and get the text
          try {
            return this.openDropdown().then(() => {
              // Define the selector for finding options
              const selector = `[data-testid="${this.dataTestId}-item"][data-field-name="${this.fieldName}"]`;

              // Use the same approach as selectById - find by data-testid and data-field-name, then filter by data-value-id
              return cy
                .get("body")
                .find(selector)
                .filter(`[data-value-id="${id}"]`)
                .then(($option) => {
                  let displayText = id;

                  if ($option.length > 0) {
                    // Get the text content of the option
                    displayText = $option.text().trim();
                  }

                  // Close the dropdown
                  this.closeDropdown();
                  return cy.wrap(displayText);
                });
            });
          } catch (e) {
            // If opening the dropdown fails, return the ID
            return cy.wrap(id || "");
          }
        });
      });
    });
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

  /**
   * Check if the field is required
   */
  isRequired(): Cypress.Chainable<boolean> {
    // First try to get the element using our selector method
    return this.getElement().then(($el) => {
      // Check if the element has the required attribute
      const isRequired = $el.attr("required") !== undefined;

      if (isRequired) {
        return cy.wrap(true);
      }

      // Check if any input elements inside are required
      const $input = $el.find("input");
      if ($input.length > 0) {
        const inputRequired =
          $input.attr("required") !== undefined ||
          $input.prop("required") === true;

        if (inputRequired) {
          return cy.wrap(true);
        }
      }

      // For Material-UI, we can also check if the label has an asterisk
      const $label = $el.find(".MuiFormLabel-asterisk");
      const hasAsterisk = $label.length > 0;

      return cy.wrap(isRequired || hasAsterisk);
    });
  }

  /**
   * Check if the field is disabled
   */
  isDisabled(): Cypress.Chainable<boolean> {
    // First try to get the element using our selector method
    return this.getElement().then(($el) => {
      // Check if the element itself has the disabled attribute or class
      const elDisabled =
        $el.prop("disabled") === true ||
        $el.hasClass("Mui-disabled") ||
        $el.attr("aria-disabled") === "true";

      if (elDisabled) {
        return cy.wrap(true);
      }

      // Check if any input elements inside are disabled
      const $input = $el.find("input");
      if ($input.length > 0) {
        const inputDisabled =
          $input.prop("disabled") === true ||
          $input.hasClass("Mui-disabled") ||
          $input.attr("aria-disabled") === "true";

        if (inputDisabled) {
          return cy.wrap(true);
        }
      }

      return cy.wrap(false);
    });
  }

  /**
   * Click on the field to open the dropdown
   * For Material-UI Select, we need to click the div with role="combobox"
   * @override
   */
  override click(): this {
    const element = this.getElement();

    // Find and click the element with role="combobox" which is the clickable part in Material-UI Select
    // Use first() to ensure we only click on one element even if multiple are found
    element.find('[role="combobox"]').first().click({ force: true });

    // Return this for method chaining
    return this;
  }

  /**
   * Clear the current selection
   * @returns The element for chaining
   */
  clear(): Cypress.Chainable<JQuery<HTMLElement>> {
    // For single select, clear by setting empty string
    // For multi-select, clear by setting empty array
    return this.selectById(this.multiple ? [] : "");
  }

  /**
   * Get the object type from the component's data-object-type attribute
   * @returns A chainable that resolves to the object type or undefined if not set
   */
  getObjectType(): Cypress.Chainable<string | undefined> {
    return this.getElement().then(($el) => {
      const objectType = $el.attr("data-object-type");
      return cy.wrap(objectType || undefined);
    });
  }

  /**
   * Get the object ID from the component's data-object-id attribute
   * @returns A chainable that resolves to the object ID or undefined if not set
   */
  getObjectId(): Cypress.Chainable<string | undefined> {
    return this.getElement().then(($el) => {
      const objectId = $el.attr("data-object-id");
      return cy.wrap(objectId || undefined);
    });
  }
}

/**
 * Factory function to create an ObjectSelector interactable
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @param dataTestId Optional data-testid to use for selecting elements
 * @param multiple Whether this is a multi-select field
 * @returns An ObjectSelector interactable
 */
export function objectSelector(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  dataTestId: string = "ObjectSelector",
  multiple: boolean = false,
  objectType?: string,
  objectId?: string,
  index?: number
): ObjectSelectorInteractable {
  return new ObjectSelectorInteractable(
    fieldName,
    parentElement,
    dataTestId,
    multiple,
    objectType,
    objectId,
    index
  );
}

// Export the factory function and class
export default objectSelector;
