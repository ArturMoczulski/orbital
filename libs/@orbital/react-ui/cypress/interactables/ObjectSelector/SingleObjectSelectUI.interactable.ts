import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * Helper class to represent a selectable item in a SingleObjectSelectUI
 */
export class SingleObjectObjectSelectorItemInteractable {
  private element: JQuery<HTMLElement>;
  private id: string;
  private objectType: string | undefined;
  private name: string;
  private isChecked: boolean;

  constructor(element: JQuery<HTMLElement>) {
    this.element = element;
    // For dropdown items/options, data-value-id is the identifier for the option value
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
 * SingleObjectSelectUIInteractable class provides specific functionality
 * for SingleObjectSelectUI components.
 */
export class SingleObjectSelectUIInteractable extends FormInputInteractable<string> {
  protected objectType?: string;
  protected objectId?: string;
  protected index?: number;

  /**
   * Constructor for SingleObjectSelectUIInteractable
   * @param fieldName The name of the field
   * @param parentElement Optional parent element to scope the field within
   * @param objectType Optional object type for data-object-type attribute
   * @param objectId Optional object ID for data-object-id attribute
   * @param index Optional index for selecting a specific element when multiple match
   */
  constructor(
    fieldName: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    objectType?: string,
    objectId?: string,
    index?: number
  ) {
    super(fieldName, parentElement);
    this.objectType = objectType;
    this.objectId = objectId;
    this.index = index;
  }

  /**
   * Override the selector method to target the component
   * This looks for a select field with the given name and data-testid
   */
  override selector() {
    // If objectId is available, use the more specific selector
    if (this.objectId) {
      return `[data-testid="SingleObjectSelectUI"][data-field-name="${this.fieldName}"][data-object-id="${this.objectId}"]`;
    }

    // Otherwise use the standard selector with data-testid and data-field-name
    return `[data-testid="SingleObjectSelectUI"][data-field-name="${this.fieldName}"]`;
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
   * Check if the dropdown is currently open
   * @returns A chainable that resolves to true if the dropdown is open, false otherwise
   */
  isDropdownOpen(): Cypress.Chainable<boolean> {
    return cy
      .get("body")
      .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
      .then(($popover) => {
        return cy.wrap($popover.length > 0);
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
   * @returns A chainable that resolves to an array of ObjectSelectorItem objects
   */
  getItems(): Cypress.Chainable<SingleObjectObjectSelectorItemInteractable[]> {
    // Always open the dropdown first to ensure it's visible
    // This is more reliable than checking if it's already open
    return this.openDropdown().then(() => {
      // Try to find menu items with multiple possible selectors
      return cy
        .get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('.MuiMenuItem-root, [role="option"], li')
        .then(($menuItems) => {
          const items: SingleObjectObjectSelectorItemInteractable[] = [];
          $menuItems.each((_, el) => {
            const item = new SingleObjectObjectSelectorItemInteractable(
              Cypress.$(el)
            );
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
  getSelectedItems(): Cypress.Chainable<
    SingleObjectObjectSelectorItemInteractable[]
  > {
    // Create an empty array with the correct type
    const emptyItems: SingleObjectObjectSelectorItemInteractable[] = [];

    // Check if dropdown is already open
    return this.isDropdownOpen().then((isOpen) => {
      if (isOpen) {
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
        // For single select, return as array with one item for consistency
        return cy.wrap(value ? [value.toString()] : []);
      }

      // Check if the combobox is empty (no text content)
      const comboboxText = $el.find('[role="combobox"]').text().trim();
      if (!comboboxText || comboboxText === "" || comboboxText === "​") {
        return cy.wrap([] as string[]);
      }

      // Check if dropdown is already open before trying to open it
      return this.isDropdownOpen().then((isOpen) => {
        // If dropdown is not open and we still don't have values,
        // we can assume there are no selections (since we already checked the input and combobox)
        if (!isOpen) {
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
  getItemById(
    id: string
  ): Cypress.Chainable<SingleObjectObjectSelectorItemInteractable | undefined> {
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
  ): Cypress.Chainable<SingleObjectObjectSelectorItemInteractable | undefined> {
    return this.getItems().then((items) => {
      const foundItem = items.find((item) => item.getName().includes(name));
      return cy.wrap(foundItem || undefined);
    });
  }

  /**
   * Set a value on the object selector by selecting an option by ID
   * @param value The value to select
   */
  selectById(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element
    const element = this.getElement();

    // Open the dropdown
    this.openDropdown();

    // For single mode
    const val = value;

    // If value is empty, select the "None" option
    if (!val) {
      cy.get("body")
        .find(
          `[data-testid="SingleObjectSelectUI-none"][data-field-name="${this.fieldName}"]`
        )
        .click();
    } else {
      // Define the selector for finding options
      const selector = `[data-testid="SingleObjectSelectUI-item"][data-field-name="${this.fieldName}"]`;

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
        `[data-testid="SingleObjectSelectUI-item"][data-field-name="${this.fieldName}"]`
      )
      .contains(displayText)
      .click();

    // Close the dropdown
    this.closeDropdown();

    return element;
  }

  /**
   * Set value on the object selector
   * @param value The value to select
   */
  setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectById(value);
  }

  /**
   * Override getValue to correctly retrieve the value from the Autocomplete component
   * @returns A chainable that resolves to the selected value
   */
  override getValue(): Cypress.Chainable<string> {
    // The most reliable method is to open the dropdown and check for the option with aria-selected="true"
    return this.getElement().then(() => {
      // Open the dropdown
      return this.openDropdown().then(() => {
        // Use cy.get with failOnStatusCode: false to prevent failing if no elements are found
        return cy
          .get('[role="option"]', { log: false })
          .filter('[aria-selected="true"]')
          .then(($options) => {
            let valueId = "";

            // If we found a selected option, get its data-value-id
            if ($options && $options.length > 0) {
              valueId = $options.attr("data-value-id") || "";
            }

            // Close the dropdown
            this.closeDropdown();

            // Return the value ID
            return cy.wrap(valueId);
          });
      });
    });
  }

  /**
   * Get the currently selected option's text
   */
  getSelectedText(): Cypress.Chainable<string> {
    // First get the current value (ID)
    return this.getValue().then((value: string) => {
      // If no value is selected, return empty string
      if (!value) {
        return cy.wrap("");
      }

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
        const $element = $el.find(`[data-value-id="${value}"]`);
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
              `[data-display-text][data-value-id="${value}"]`
            );
            if ($optionDisplay.length > 0) {
              const displayText = $optionDisplay.attr("data-display-text");
              if (displayText) {
                return cy.wrap(displayText);
              }
            }

            // If we can't find the display text for a disabled field, return the ID
            return cy.wrap(value || "");
          }

          // If the field is not disabled, try to open the dropdown and get the text
          try {
            return this.openDropdown().then(() => {
              // Define the selector for finding options
              const selector = `[data-testid="SingleObjectSelectUI-item"][data-field-name="${this.fieldName}"]`;

              // Use the same approach as selectById - find by data-testid and data-field-name, then filter by data-value-id
              return cy
                .get("body")
                .find(selector)
                .filter(`[data-value-id="${value}"]`)
                .then(($option) => {
                  let displayText = value;

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
            return cy.wrap(value || "");
          }
        });
      });
    });
  }

  /**
   * Type in the search input to filter options
   * @param searchText The text to type in the search input
   * @returns The interactable for chaining
   */
  search(searchText: string): this {
    this.getElement().find('input[type="text"]').clear().type(searchText);
    return this;
  }

  /**
   * Get the placeholder text
   * @returns A chainable that resolves to the placeholder text
   */
  getPlaceholder(): Cypress.Chainable<string> {
    return this.getElement()
      .find('input[type="text"]')
      .invoke("attr", "placeholder");
  }

  /**
   * Check if the loading indicator is visible
   * @returns A chainable that resolves to true if loading, false otherwise
   */
  isLoading(): Cypress.Chainable<boolean> {
    return this.getElement()
      .find(".MuiCircularProgress-root")
      .then(($progress) => {
        return cy.wrap($progress.length > 0);
      });
  }

  /**
   * Clear the current selection
   * @returns The element for chaining
   */
  override clear(): Cypress.Chainable<JQuery<HTMLElement>> {
    // For single select, clear by setting empty string
    return this.selectById("");
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
 * Factory function to create a SingleObjectSelectUI interactable
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @param objectType Optional object type for data-object-type attribute
 * @param objectId Optional object ID for data-object-id attribute
 * @param index Optional index for selecting a specific element when multiple match
 * @returns A SingleObjectSelectUI interactable
 */
export function singleObjectSelectUI(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectType?: string,
  objectId?: string,
  index?: number
): SingleObjectSelectUIInteractable {
  return new SingleObjectSelectUIInteractable(
    fieldName,
    parentElement,
    objectType,
    objectId,
    index
  );
}

// Export the factory function and class
export default singleObjectSelectUI;
