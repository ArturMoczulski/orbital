import { Listable, Selectable } from "../interfaces/Listable";
import { Openable } from "../interfaces/Openable";
import { Typeable } from "../interfaces/Typeable";
import { Validatable } from "../interfaces/Validatable";
import { ChipInteractable } from "./Chip.interactable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";
import { PopperInteractable } from "./Popper.interactable";

/**
 * Options for AutocompleteInteractable
 */
export interface AutocompleteInteractableOptions
  extends MaterialUIInteractableOptions {
  /**
   * Optional trigger element selector or interactable
   * This is the element that opens the autocomplete when clicked
   */
  triggerElement?: string | (() => Cypress.Chainable<JQuery<HTMLElement>>);
}

/**
 * Interactable for Material UI Autocomplete components
 * Implements the Openable and Listable interfaces to provide methods for
 * opening, closing, checking state, and interacting with list items
 */
export class AutocompleteInteractable
  extends MaterialUIInteractable
  implements Openable, Listable, Selectable, Typeable, Validatable
{
  /**
   * Internal PopperInteractable instance for delegating Openable methods
   */
  protected popper: PopperInteractable;

  constructor(options: AutocompleteInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Autocomplete",
    });

    // If no triggerElement is provided, create a default one that finds the input element
    const popperOptions = { ...options };

    if (!popperOptions.triggerElement) {
      popperOptions.triggerElement = () => {
        return this.get().find("input") as unknown as Cypress.Chainable<
          JQuery<HTMLElement>
        >;
      };
    }

    // Create internal PopperInteractable instance
    this.popper = new PopperInteractable({
      ...popperOptions,
      dataTestId: undefined,
      componentName: "Popper", // Use Popper component name for the internal instance
    });
  }

  /**
   * Gets the text field element of the autocomplete
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the text field element
   */
  textField(): Cypress.Chainable<JQuery<HTMLElement>> {
    // Use the specific MuiAutocomplete-input class for better targeting
    // Fall back to input if the specific class isn't found
    return this.get().then(($el) => {
      const $input = $el.find(".MuiAutocomplete-input");
      if ($input.length > 0) {
        return cy.wrap($input) as unknown as Cypress.Chainable<
          JQuery<HTMLElement>
        >;
      } else {
        return cy.wrap($el.find("input")) as unknown as Cypress.Chainable<
          JQuery<HTMLElement>
        >;
      }
    });
  }

  /**
   * Gets the trigger element that opens the autocomplete
   * Uses the textField method for consistency
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.textField();
  }

  /**
   * Triggers the autocomplete by clicking the trigger element
   * Delegates to the internal popper instance
   * @returns this - for method chaining
   */
  trigger(): this {
    this.popper.trigger();
    return this;
  }

  /**
   * Opens the autocomplete by triggering it
   * Delegates to the internal popper instance
   * @returns Cypress.Chainable<void> - for method chaining
   */
  open(): Cypress.Chainable<void> {
    return this.popper.open();
  }

  /**
   * Closes the autocomplete
   * Delegates to the internal popper instance
   * @returns Cypress.Chainable<void> - for method chaining
   */
  close(): Cypress.Chainable<void> {
    return this.popper.close();
  }

  /**
   * Checks if the autocomplete is currently triggered/opened
   * Uses custom implementation for autocomplete poppers
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the autocomplete is triggered
   */
  isTriggered(): Cypress.Chainable<boolean> {
    // Directly delegate to the popper instance
    return this.popper.isTriggered();
  }

  /**
   * Checks if the autocomplete is currently open
   * This is a shortcut to isTriggered
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the autocomplete is open
   */
  isOpened(): Cypress.Chainable<boolean> {
    return this.isTriggered();
  }

  /**
   * Checks if the autocomplete is currently closed
   * @returns Cypress.Chainable<boolean> - chainable that yields true if the autocomplete is closed
   */
  isClosed(): Cypress.Chainable<boolean> {
    return this.isOpened().then((isOpen) => !isOpen);
  }

  /**
   * Gets the content of the autocomplete
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the content element of the autocomplete
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.popper.get().find(".MuiPaper-root");
  }

  /**
   * Clicks on an element within the autocomplete content by its data-testid
   * @param dataTestId - the data-testid of the element to click
   * @returns this - for method chaining
   */
  clickOnElement(dataTestId: string): this {
    this.getContent().find(`[data-testid="${dataTestId}"]`).click();
    return this;
  }

  /**
   * Gets the listbox element that contains the options
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the listbox element
   */
  protected getListbox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.open().then(() => {
      return this.popper.get().find('[role="listbox"]');
    });
  }

  /**
   * Gets all option elements in the listbox
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - all option elements
   */
  items(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getListbox().then((listbox) => listbox.find('[role="option"]'));
  }

  /**
   * Gets a specific option element by its text content
   * @param text - The text content to search for
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the found option element
   */
  item(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.items().then((items) =>
      items.filter(`:contains("${text}")`).first()
    );
  }

  /**
   * Selects an option or multiple options from the autocomplete by text content
   * @param text - The text content of the option(s) to select (string or array of strings)
   * @returns this - for method chaining
   */
  select(text: string | string[]): this {
    if (Array.isArray(text)) {
      // Handle multiple selections
      text.forEach((item) => {
        this.open(); // Make sure the dropdown is open for each selection
        this.item(item).click();
        cy.wait(100); // Wait for the selection to be processed
      });
    } else {
      // Handle single selection
      this.open(); // Make sure the dropdown is open
      this.item(text).click();
      cy.wait(100); // Wait for the selection to be processed
    }

    return this;
  }

  /**
   * Gets the chip interactables for multiple selection mode
   * @returns Cypress.Chainable<ChipInteractable[]> - chainable that resolves to an array of chip interactables
   */
  chips(): Cypress.Chainable<ChipInteractable[]> {
    return this.get().then(($el) => {
      const $chips = $el.find(".MuiChip-root");
      const chipInteractables: ChipInteractable[] = [];

      $chips.each((index, _) => {
        console.log(`chip index`, index);
        chipInteractables.push(
          new ChipInteractable({
            componentName: "Chip",
            parentElement: () => cy.wrap($el),
            index: index,
          })
        );
      });

      return chipInteractables;
    });
  }

  /**
   * Gets the labels of all chips in the autocomplete
   * This method is used internally by selected()
   * @returns Cypress.Chainable<string[]> - chainable that resolves to an array of chip labels
   * @private
   */
  /**
   * Helper method to collect all chip labels using Promise.all
   * @private
   */
  public chipLabels(chips: ChipInteractable[]): Cypress.Chainable<string[]> {
    if (chips.length === 0) {
      return cy.wrap([] as string[]);
    }

    // Create an array of promises for each chip's label
    const labelPromises = chips.map((chip) => {
      return new Cypress.Promise<string>((resolve) => {
        chip.label().then((label) => resolve(label));
      });
    });

    // Use Promise.all to collect all labels in parallel
    return cy.wrap(Cypress.Promise.all(labelPromises));
  }

  /**
   * Gets the currently selected item(s) from the autocomplete
   * @returns Cypress.Chainable<string | string[]> - chainable that resolves to the selected text or array of selected texts
   */
  selected(): Cypress.Chainable<string | string[]> {
    // Create a new chainable that will resolve to either a string or string[]
    return cy.wrap(null).then(() => {
      // Check if this is a multiple selection autocomplete
      return this.isMultipleSelection().then((isMultiple) => {
        if (isMultiple) {
          // For multiple selection, check if we've just cleared the selection
          return this.get().then(($el) => {
            // Check if there are any chips
            const hasChips = $el.find(".MuiChip-root").length > 0;

            // If no chips are found, return an empty array
            if (!hasChips) {
              // This is critical for the "should clear all selections in multiple selection mode" test
              // We must return an empty array, not an empty string or a wrapped array
              return [] as string[];
            }

            // Otherwise, get all chips and collect their labels
            return this.chips().then((chips) => {
              if (chips.length === 0) {
                // Return an empty array with explicit type assertion
                return [] as string[];
              }
              return this.chipLabels(chips);
            });
          });
        } else {
          // For single selection, get the input value
          return this.getTriggerElement().then(($input) => {
            const inputValue = $input.val();
            return !inputValue ||
              (Array.isArray(inputValue) && inputValue.length === 0)
              ? ""
              : (inputValue as string);
          });
        }
      });
    }) as unknown as Cypress.Chainable<string | string[]>;
  }

  /**
   * Types text into the autocomplete input field
   * @param text - The text to type
   * @returns this - for method chaining
   */
  type(text: string): this {
    // Get the input field and type the text
    this.textField().clear().type(text);
    cy.wait(100); // Wait for the typing to be processed
    return this;
  }

  /**
   * Clears the text input field without affecting selections
   * @returns this - for method chaining
   */
  clearTextInput(): this {
    // Store the current selection before clearing
    this.selected().then((selectedValue) => {
      // For the large-autocomplete test case, we need special handling
      this.get().then(($el) => {
        // For other autocompletes, use a simpler approach
        // Clear the input field
        this.textField().clear();

        // Press Escape key to restore the selected value
        this.textField().type("{esc}", { force: true });

        // If there was a selection and this is a single selection autocomplete,
        // verify the value was restored
        if (selectedValue && !Array.isArray(selectedValue)) {
          this.textField().invoke("val").should("eq", selectedValue);
        }
      });
    });

    return this;
  }

  /**
   * Deselects a specific item by its text content
   * For multiple selection, it finds and clicks the remove button (X) for the specific chip
   * For single selection, it clears the selection if it matches the provided text
   * @param text - The text content of the item to deselect
   * @returns this - for method chaining
   */
  deselect(text: string): this {
    // Check if this is a multiple selection autocomplete
    this.isMultipleSelection().then((isMultiple) => {
      if (isMultiple) {
        // Multiple selection mode - use the chips() method directly to get chip interactables
        this.chips().then((chipInteractables) => {
          // Use a recursive approach to process chips one by one
          const processChips = (index: number): Cypress.Chainable<void> => {
            // Base case: we've processed all chips
            if (index >= chipInteractables.length) {
              return cy.wrap(undefined) as Cypress.Chainable<void>;
            }

            // Get the current chip's label
            return chipInteractables[index].label().then((chipText) => {
              // If this chip matches the text, delete it
              if (chipText === text) {
                // Delete the chip and then return a void chainable
                chipInteractables[index].delete();
                return cy.wrap(undefined) as Cypress.Chainable<void>;
              } else {
                // Otherwise, process the next chip
                return processChips(index + 1);
              }
            });
          };

          // Start processing with the first chip
          processChips(0);
        });
      } else {
        // Single selection mode - check if current value matches text
        this.selected().then((selectedValue) => {
          if (selectedValue === text) {
            this.clearSelection();
          }
        });
      }
    });

    cy.wait(200); // Wait longer for the deselection to be processed
    return this;
  }

  /**
   * Checks if this is a multiple selection autocomplete
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if this is a multiple selection autocomplete
   */
  protected isMultipleSelection(): Cypress.Chainable<boolean> {
    return cy.then(() => {
      // First check for chips which is the most reliable visual indicator
      return this.get().then(($el) => {
        // Check for chips (which only appear in multiple selection)
        const hasChips = $el.find(".MuiChip-root").length > 0;

        if (hasChips) {
          // If we have chips, we know it's multiple selection without opening dropdown
          return cy.wrap(true);
        }

        // Always open the dropdown to ensure all attributes are available
        return this.open().then(() => {
          return this.get().then(($el) => {
            // Check for multiple selection indicators
            // 1. Check for the data-multiple attribute on the root element
            const hasMultipleRoot = $el.attr("data-multiple") === "true";

            // 2. Check for aria-multiselectable attribute on input
            const hasMultipleAttr =
              $el.find('input[aria-multiselectable="true"]').length > 0;

            // Close the dropdown to restore original state
            return this.close().then(() => {
              return cy.wrap(hasMultipleRoot || hasMultipleAttr);
            });
          });
        });
      });
    });
  }

  /**
   * Gets the clear indicator element of the autocomplete
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the clear indicator element
   */
  clearIndicator(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().find(".MuiAutocomplete-clearIndicator");
  }

  /**
   * Clears all selections by clicking the clear indicator
   * @returns this - for method chaining
   */
  clearSelection(): this {
    // Check if there's anything selected before trying to clear
    this.selected().then((selected) => {
      const hasSelection = Array.isArray(selected)
        ? selected.length > 0
        : selected !== "";

      if (hasSelection) {
        // Check if this is a multiple selection autocomplete
        this.isMultipleSelection().then((isMultiple) => {
          // Find and click the clear indicator
          this.clearIndicator().click({ force: true });

          cy.wait(100); // Wait for the clearing to be processed

          if (isMultiple) {
            // For multiple selection mode, ensure chips are removed
            this.get().find(".MuiChip-root").should("not.exist");

            // The selected() method should now correctly return an empty array
            // when there are no chips, so we don't need to override anything here
          } else {
            // For single selection mode, verify the input is cleared
            this.textField().invoke("val").should("eq", "");
          }
        });
      }
    });

    return this;
  }

  /**
   * Checks if the autocomplete is currently in an error state
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the autocomplete has an error
   */
  hasError(): Cypress.Chainable<boolean> {
    return cy.then(() => {
      // Check for error state on the TextField
      return this.get().then(($el) => {
        // Check for the Mui-error class on various elements
        // 1. Check the input element
        const hasInputErrorClass = $el.find("input").hasClass("Mui-error");

        // 2. Check the form control root
        const hasFormControlErrorClass = $el
          .find(".MuiFormControl-root")
          .hasClass("Mui-error");

        // 3. Check the fieldset element (often contains the error styling for the border)
        const hasFieldsetErrorClass = $el
          .find("fieldset")
          .hasClass("Mui-error");

        // 4. Check the label element
        const hasLabelErrorClass = $el.find("label").hasClass("Mui-error");

        // 5. Check if there's a helper text with error
        const hasHelperTextError =
          $el.find(".MuiFormHelperText-root").length > 0;

        // 6. Check if the error prop is set (by checking for specific error-related classes)
        const hasErrorProp =
          $el.find(".MuiOutlinedInput-notchedOutline").hasClass("Mui-error") ||
          $el.find(".MuiInputBase-root").hasClass("Mui-error");

        // Return true if any of the error indicators are found
        return (
          hasInputErrorClass ||
          hasFormControlErrorClass ||
          hasFieldsetErrorClass ||
          hasLabelErrorClass ||
          hasHelperTextError ||
          hasErrorProp
        );
      });
    });
  }

  /**
   * Gets the error message displayed by the autocomplete
   * @returns Cypress.Chainable<string> - chainable that resolves to the error message text
   */
  getError(): Cypress.Chainable<string> {
    return cy.then(() => {
      return this.get().then(($el) => {
        // Check if the helper text element exists
        const $helperText = $el.find(".MuiFormHelperText-root");

        if ($helperText.length > 0) {
          // If helper text exists, return its text
          return Cypress.$($helperText).text();
        } else {
          // If no helper text, return empty string
          return "";
        }
      });
    });
  }
}

export default AutocompleteInteractable;
