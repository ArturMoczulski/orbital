import { ObjectSelectorInteractable } from "./ObjectSelector.interactable";

/**
 * MultiObjectSelectUIInteractable class extends ObjectSelectorInteractable
 * to provide specific functionality for MultiObjectSelectUI components.
 */
export class MultiObjectSelectUIInteractable extends ObjectSelectorInteractable {
  /**
   * Constructor for MultiObjectSelectUIInteractable
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
    // Pass the correct data-testid prefix to the ObjectSelectorInteractable
    // and set multiple to true since this is a multi-select field
    super(
      fieldName,
      parentElement,
      "MultiObjectSelectUI",
      true,
      objectType,
      objectId,
      index
    );
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
   * Get all selected chips
   * @returns A chainable that resolves to an array of chip text values
   */
  getSelectedChips(): Cypress.Chainable<string[]> {
    return this.getElement()
      .find(".MuiChip-root")
      .then(($chips) => {
        const chipTexts: string[] = [];
        $chips.each((_, chip) => {
          const chipText = Cypress.$(chip).find(".MuiChip-label").text().trim();
          if (chipText) {
            chipTexts.push(chipText);
          }
        });
        return cy.wrap(chipTexts);
      });
  }

  /**
   * Remove a chip by its text content
   * @param chipText The text content of the chip to remove
   * @returns The interactable for chaining
   */
  removeChip(chipText: string): this {
    this.getElement()
      .find(".MuiChip-root")
      .each(($chip) => {
        const text = $chip.find(".MuiChip-label").text().trim();
        if (text === chipText) {
          cy.wrap($chip).find(".MuiChip-deleteIcon").click();
        }
      });
    return this;
  }

  /**
   * Clear all selected chips
   * @returns The interactable for chaining
   */
  clearAll(): this {
    this.getElement()
      .find(".MuiChip-root .MuiChip-deleteIcon")
      .each(($deleteIcon) => {
        cy.wrap($deleteIcon).click();
      });
    return this;
  }
}

/**
 * Factory function to create a MultiObjectSelectUI interactable
 * @param fieldName The name of the field
 * @param parentElement Optional parent element to scope the field within
 * @param objectType Optional object type for data-object-type attribute
 * @param objectId Optional object ID for data-object-id attribute
 * @param index Optional index for selecting a specific element when multiple match
 * @returns A MultiObjectSelectUI interactable
 */
export function multiObjectSelectUI(
  fieldName: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  objectType?: string,
  objectId?: string,
  index?: number
): MultiObjectSelectUIInteractable {
  return new MultiObjectSelectUIInteractable(
    fieldName,
    parentElement,
    objectType,
    objectId,
    index
  );
}

// Export the factory function and class
export default multiObjectSelectUI;
