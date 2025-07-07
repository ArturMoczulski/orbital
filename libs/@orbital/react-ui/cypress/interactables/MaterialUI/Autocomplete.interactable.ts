import { FormInputInteractable } from "../AutoForm/FormInput.interactable";

/**
 * Helper class to represent a selectable item in an Autocomplete dropdown
 */
export class AutocompleteOptionInteractable {
  private element: JQuery<HTMLElement>;
  private id: string;
  private text: string;
  private isSelected: boolean;

  constructor(element: JQuery<HTMLElement>) {
    this.element = element;
    this.id =
      element.attr("data-value-id") || element.attr("data-option-id") || "";
    this.text = element.text().trim();
    this.isSelected = element.attr("aria-selected") === "true";
  }

  /**
   * Get the ID of the option
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get the display text of the option
   */
  getText(): string {
    return this.text;
  }

  /**
   * Check if the option is currently selected
   */
  isActive(): boolean {
    return this.isSelected;
  }

  /**
   * Click on the option to select it
   */
  click(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.wrap(this.element).click({ force: true });
  }
}

/**
 * Interactable for Material UI Autocomplete component
 * Provides methods to interact with Autocomplete in Cypress tests
 */
export class AutocompleteInteractable extends FormInputInteractable<string> {
  protected dataTestId?: string;
  protected index?: number;

  /**
   * Constructor for AutocompleteInteractable
   * @param fieldName Optional name or ID of the field
   * @param parentElement Optional parent element to scope the field within
   * @param dataTestId Optional data-testid attribute value to identify the component
   * @param index Optional index for selecting a specific element when multiple match
   */
  constructor(
    fieldName?: string,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
    dataTestId?: string,
    index?: number
  ) {
    super(fieldName, parentElement);
    this.dataTestId = dataTestId;
    this.index = index;
  }

  /**
   * Override the selector method to target the Autocomplete component
   */
  override selector(): string {
    // First priority: Use data-testid if provided
    if (this.dataTestId) {
      return `.MuiAutocomplete-root[data-testid=TestableAutocomplete`;
    }

    // Second priority: Use fieldName if provided
    if (this.fieldName) {
      return `.MuiAutocomplete-root:has(input[name="${this.fieldName}"])`;
    }

    // Fallback: Look for any Autocomplete component
    return `.MuiAutocomplete-root`;
  }

  /**
   * Override getElement to handle the index parameter
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
   * Open the dropdown menu
   * @returns A chainable that resolves when the dropdown is open
   */
  openDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Check if dropdown is already open
    return this.isDropdownOpen().then((isOpen) => {
      if (!isOpen) {
        // Click directly on the combobox element which is what Material UI uses for the Autocomplete
        this.getElement().find('[role="combobox"]').click({ force: true });

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
   * Close the dropdown menu
   * @returns A chainable that resolves when the dropdown is closed
   */
  closeDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Check if dropdown is open
    return this.isDropdownOpen().then((isOpen) => {
      if (isOpen) {
        // Click away to close the dropdown
        cy.get("body").click(0, 0);

        // Wait for the dropdown to disappear
        return cy
          .get("body")
          .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
          .should("not.exist");
      }

      // If already closed, return the element
      return this.getElement();
    });
  }

  /**
   * Get all options in the dropdown
   * @returns A chainable that resolves to an array of AutocompleteOptionInteractable objects
   */
  getOptions(): Cypress.Chainable<AutocompleteOptionInteractable[]> {
    // Always open the dropdown first to ensure it's visible
    return this.openDropdown().then(() => {
      // Try to find options with multiple possible selectors
      return cy
        .get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('[role="option"], .MuiAutocomplete-option, .MuiMenuItem-root, li')
        .then(($options) => {
          const options: AutocompleteOptionInteractable[] = [];
          $options.each((_, el) => {
            const option = new AutocompleteOptionInteractable(Cypress.$(el));
            options.push(option);
          });
          return cy.wrap(options);
        });
    });
  }

  /**
   * Get the selected options
   * @returns A chainable that resolves to an array of selected AutocompleteOptionInteractable objects
   */
  getSelectedOptions(): Cypress.Chainable<AutocompleteOptionInteractable[]> {
    return this.openDropdown().then(() => {
      return cy
        .get("body")
        .find('[role="option"][aria-selected="true"]')
        .then(($selectedOptions) => {
          const options: AutocompleteOptionInteractable[] = [];
          $selectedOptions.each((_, el) => {
            const option = new AutocompleteOptionInteractable(Cypress.$(el));
            options.push(option);
          });

          // Close the dropdown
          this.closeDropdown();

          return cy.wrap(options);
        });
    });
  }

  /**
   * Select an option by its ID
   * @param value The ID of the option to select
   * @returns A chainable that resolves to the element
   */
  selectById(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element
    const element = this.getElement();

    // If value is empty, clear the selection
    if (!value) {
      return this.clear();
    }

    // Open the dropdown
    this.openDropdown();

    // Find the option with the given value
    cy.get("body")
      .find('[role="option"]')
      .filter(`[data-value-id="${value}"], [data-option-id="${value}"]`)
      .first()
      .click();

    // Close the dropdown
    this.closeDropdown();

    return element;
  }

  /**
   * Select an option by its display text
   * @param text The display text of the option to select
   * @returns A chainable that resolves to the element
   */
  selectByText(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Get the element
    const element = this.getElement();

    // Open the dropdown
    this.openDropdown();

    // Find the option with the given text
    cy.get("body").find('[role="option"]').contains(text).first().click();

    // Close the dropdown
    this.closeDropdown();

    return element;
  }

  /**
   * Set a value on the Autocomplete
   * @param value The value to set
   * @returns A chainable that resolves to the element
   */
  setValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectById(value);
  }

  /**
   * Get the current value of the Autocomplete
   * @returns A chainable that resolves to the selected value
   */
  override getValue(): Cypress.Chainable<string> {
    // The most reliable method is to open the dropdown and check for the option with aria-selected="true"
    return this.getElement().then(() => {
      // Open the dropdown
      return this.openDropdown().then(() => {
        // Look for options with aria-selected="true"
        return cy
          .get('[role="option"]', { log: false })
          .filter('[aria-selected="true"]')
          .then(($options) => {
            let valueId = "";

            // If we found a selected option, get its data-value-id
            if ($options && $options.length > 0) {
              valueId =
                $options.attr("data-value-id") ||
                $options.attr("data-option-id") ||
                "";
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
   * Get the display text of the selected option
   * @returns A chainable that resolves to the display text
   */
  getDisplayText(): Cypress.Chainable<string> {
    // First check the input field text
    return this.getElement().then(($el) => {
      const $input = $el.find('input[type="text"]');
      const inputText = $input.val()?.toString().trim();

      // If there's text in the input, return it
      if (inputText && inputText !== "" && inputText !== "​") {
        return cy.wrap(inputText);
      }

      // Otherwise, try to get the selected option's text
      return this.getValue().then((value) => {
        if (!value) {
          return cy.wrap("");
        }

        // Open the dropdown and find the selected option
        return this.openDropdown().then(() => {
          return cy
            .get('[role="option"]')
            .filter(`[data-value-id="${value}"], [data-option-id="${value}"]`)
            .then(($option) => {
              const text = $option.text().trim();

              // Close the dropdown
              this.closeDropdown();

              return cy.wrap(text);
            });
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
    const element = this.getElement();

    // For Material UI Autocomplete, we can click the clear button if it exists
    element.find(".MuiAutocomplete-clearIndicator").then(($clearButton) => {
      if ($clearButton.length > 0) {
        cy.wrap($clearButton).click();
      } else {
        // If no clear button, try to clear the input field
        element.find('input[type="text"]').clear();
      }
    });

    return element;
  }

  /**
   * Click on the field to open the dropdown
   * @override
   */
  override click(): this {
    const element = this.getElement();

    // Find and click the element with role="combobox" which is the clickable part in Material-UI Autocomplete
    element.find('[role="combobox"]').first().click({ force: true });

    // Return this for method chaining
    return this;
  }
}

/**
 * Factory function to create an Autocomplete interactable
 * @param fieldName Optional name or ID of the field
 * @param parentElement Optional parent element to scope the field within
 * @param dataTestId Optional data-testid attribute value to identify the component
 * @param index Optional index for selecting a specific element when multiple match
 * @returns An Autocomplete interactable
 */
export function autocomplete(
  fieldName?: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  dataTestId?: string,
  index?: number
): AutocompleteInteractable {
  return new AutocompleteInteractable(
    fieldName,
    parentElement,
    dataTestId,
    index
  );
}

// Export the factory function and class
export default autocomplete;
