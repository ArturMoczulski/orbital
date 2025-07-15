import { Listable, Selectable } from "../interfaces/Listable";
import { Loadable } from "../interfaces/Loadable";
import { Openable } from "../interfaces/Openable";
import { Typeable } from "../interfaces/Typeable";
import { Validatable } from "../interfaces/Validatable";
import { ChipInteractable } from "./Chip.interactable";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";
import {
  PopperInteractable,
  PopperInteractableOptions,
} from "./Popper.interactable";

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
  implements Openable, Listable, Selectable, Typeable, Validatable, Loadable
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

    const popperOptions = {
      triggerElement: options.triggerElement,
    } as PopperInteractableOptions;

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
   * Gets a specific option element by its ID attribute
   * @param id - The ID to search for
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the found option element
   */
  itemById(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // Create a new promise that will resolve to the correct type
    return cy.wrap(
      new Cypress.Promise<JQuery<HTMLElement>>((resolve) => {
        this.items().then((items) => {
          // First try to find by data-id attribute
          const byDataId = items.filter(`[data-id="${id}"]`);
          if (byDataId.length > 0) {
            resolve(byDataId.first());
            return;
          }

          // Then try to find by id attribute
          const byId = items.filter(`[id="${id}"]`);
          if (byId.length > 0) {
            resolve(byId.first());
            return;
          }

          // Try to find by value attribute
          const byValue = items.filter(`[value="${id}"]`);
          if (byValue.length > 0) {
            resolve(byValue.first());
            return;
          }

          // Try to find by text content that matches the ID
          // This is useful for reference fields where the option text might be the display name
          // but we're selecting by ID
          const allOptions = items.toArray();
          for (let i = 0; i < allOptions.length; i++) {
            const option = allOptions[i];
            const $option = Cypress.$(option);

            // Check if any data attribute contains the ID
            const allDataAttrs = Object.keys($option.data()).map((key) =>
              $option.data(key)
            );
            if (allDataAttrs.includes(id)) {
              resolve($option);
              return;
            }

            // Check if this option has a child element with the ID as text
            if ($option.find(`:contains("${id}")`).length > 0) {
              resolve($option);
              return;
            }
          }

          // If no match found, log a warning and resolve with an empty jQuery object
          cy.log(`Warning: No option with ID "${id}" found`);
          resolve(Cypress.$());
        });
      })
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
        cy.wait(50); // Wait for the selection to be processed
      });
    } else {
      // Handle single selection
      this.open(); // Make sure the dropdown is open
      this.item(text).click();
      cy.wait(100); // Wait for the selection to be processed

      // For single selection, check if the field is focused before blurring
      // This prevents the "cy.blur() can only be called when there is a currently focused element" error
      cy.document().then((doc) => {
        this.textField().then(($field) => {
          // Check if any element in the field is the active element
          const activeElement = doc.activeElement;
          const fieldElements = $field.toArray();

          // Type-safe check if the field is focused
          const isFieldFocused = fieldElements.some(
            (el) => el === activeElement
          );

          if (isFieldFocused) {
            // Only blur if the field is focused
            this.textField().blur();
          }
        });
      });
    }

    return this;
  }

  /**
   * Selects an option or multiple options from the autocomplete by ID
   * @param id - The ID of the option(s) to select (string or array of strings)
   * @returns this - for method chaining
   */
  selectById(id: string | string[]): this {
    if (Array.isArray(id)) {
      // Handle multiple selections
      id.forEach((itemId) => {
        this.open(); // Make sure the dropdown is open for each selection
        cy.wait(50); // Wait for dropdown to fully open

        // Check if the element exists before clicking
        this.itemById(itemId).then(($el) => {
          if ($el && $el.length > 0) {
            // Element exists, click it
            cy.wrap($el).click({ force: true });
            cy.wait(100); // Wait time for the selection to be processed
            this.get().trigger("change", { force: true });
          } else {
            // Element doesn't exist, try to select by typing and selecting the first option
            cy.log(
              `Warning: Cannot find option with ID "${itemId}" directly, trying alternative selection method`
            );

            // Type the ID to filter options
            this.textField().clear().type(itemId);
            cy.wait(150); // Wait for filtering

            // Try to select the first option
            this.items().then(($items) => {
              if ($items.length > 0) {
                cy.wrap($items.first()).click({ force: true });
                cy.wait(100); // Wait time
                this.get().trigger("change", { force: true });
              } else {
                cy.log(`Warning: No options found after typing "${itemId}"`);
                this.close();
              }
            });
          }
        });

        // Ensure the selection is registered by triggering change events
        this.textField().trigger("change", { force: true });
      });

      // Final blur to ensure all selections are committed
      this.textField().blur();
      cy.wait(100); // Wait for state to update
    } else {
      // Handle single selection
      this.open(); // Make sure the dropdown is open
      cy.wait(50); // Wait for dropdown to fully open

      // Check if the element exists before clicking
      this.itemById(id).then(($el) => {
        if ($el && $el.length > 0) {
          // Element exists, click it
          cy.wrap($el).click({ force: true });
          cy.wait(150); // Wait time for the selection to be processed
          this.get().trigger("change", { force: true });

          // Force a change event to ensure the selection is registered
          this.textField().trigger("change", { force: true });
          cy.wait(100); // Wait for change event to be processed

          // For single selection, check if the field is focused before blurring
          cy.document().then((doc) => {
            this.textField().then(($field) => {
              // Check if any element in the field is the active element
              const activeElement = doc.activeElement;
              const fieldElements = $field.toArray();

              // Type-safe check if the field is focused
              const isFieldFocused = fieldElements.some(
                (el) => el === activeElement
              );

              if (isFieldFocused) {
                // Only blur if the field is focused
                this.textField().blur();
              }
              cy.wait(50); // Wait for blur to take effect
            });
          });

          // Explicitly trigger change event to ensure it's captured
          this.textField().trigger("change", { force: true });
        } else {
          // Element doesn't exist, try to select by typing and selecting the first option
          cy.log(
            `Warning: Cannot find option with ID "${id}" directly, trying alternative selection method`
          );

          // Type the ID to filter options
          this.textField().clear().type(id);
          cy.wait(150); // Wait for filtering

          // Try to select the first option
          this.items().then(($items) => {
            if ($items.length > 0) {
              cy.wrap($items.first()).click({ force: true });
              cy.wait(100); // Wait time
              this.get().trigger("change", { force: true });

              // Blur the field
              this.textField().blur();
              cy.wait(50); // Wait for blur to take effect

              // Explicitly trigger change event
              this.textField().trigger("change", { force: true });
            } else {
              cy.log(`Warning: No options found after typing "${id}"`);
              this.close();
            }
          });
        }
      });
    }

    // Wait for any state updates to complete
    cy.wait(50);
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
    // Use a completely different approach with explicit Promise
    return cy.wrap(
      new Cypress.Promise<string | string[]>((resolve) => {
        // First determine if this is a multiple selection
        this.isMultipleSelection().then((isMultiple) => {
          if (isMultiple) {
            // For multiple selection
            this.get().then(($el) => {
              // Check if there are any chips
              if ($el.find(".MuiChip-root").length === 0) {
                resolve([]);
                return;
              }

              // Get all chips and their labels
              this.chips().then((chips) => {
                if (chips.length === 0) {
                  resolve([]);
                  return;
                }

                this.chipLabels(chips).then((labels) => {
                  resolve(labels);
                });
              });
            });
          } else {
            // For single selection
            this.getTriggerElement().then(($input) => {
              const value = $input.val();
              resolve(value ? (value as string) : "");
            });
          }
        });
      })
    );
  }

  /**
   * Types text into the autocomplete input field
   * @param text - The text to type
   * @returns this - for method chaining
   */
  type(text: string): this {
    // Get the input field and type the text
    this.textField().clear().type(text);
    cy.wait(50); // Wait for the typing to be processed
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

    cy.wait(100); // Wait for the deselection to be processed
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
          if (isMultiple) {
            // For multiple selection, click the clear indicator
            this.clearIndicator().click({ force: true });
            cy.wait(100); // Wait time for the clearing to be processed

            // For multiple selection mode, ensure chips are removed
            this.get().find(".MuiChip-root").should("not.exist");

            // Explicitly trigger change event to ensure it's captured
            this.textField().trigger("change", { force: true });
            cy.wait(50); // Wait for change event to be processed
          } else {
            // For single selection, we need to:
            // 1. Focus the input field
            this.textField().click();
            cy.wait(50); // Wait time

            // 2. Clear the input using Cypress clear() which simulates user interaction
            this.textField().clear();
            cy.wait(50); // Wait time

            // 3. Click the clear indicator to ensure the selection is fully cleared
            this.clearIndicator().click({ force: true });
            cy.wait(50); // Wait time

            // 4. Blur the field to ensure change events are triggered
            this.textField().blur();
            cy.wait(50); // Wait time

            // 5. Set the input value to empty string explicitly and trigger events
            this.textField()
              .invoke("val", "")
              .trigger("input", { force: true })
              .trigger("change", { force: true });
            cy.wait(50); // Wait time

            // 6. Verify the input is cleared
            this.textField().invoke("val").should("eq", "");
          }

          // Final blur to ensure all changes are committed - only if element is focused
          // Use a try-catch block to handle potential blur errors
          try {
            cy.document().then((doc) => {
              this.textField().then(($field) => {
                // Check if any element in the field is the active element
                const activeElement = doc.activeElement;
                const fieldElements = $field.toArray();

                // Type-safe check if the field is focused
                const isFieldFocused = fieldElements.some(
                  (el) => el === activeElement
                );

                if (isFieldFocused) {
                  // Only blur if the field is focused
                  this.textField().blur();
                }
                cy.wait(50);
              });
            });
          } catch (error) {
            // Log the error but continue execution
            cy.log("Warning: Error during blur operation - continuing test");
          }
        });
      }
    });

    // Wait for any state updates to complete
    cy.wait(50);
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
   * Checks if the autocomplete is currently disabled
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the autocomplete is disabled
   */
  isDisabled(): Cypress.Chainable<boolean> {
    return cy.then(() => {
      return this.get().then(($el) => {
        // Primary check: Check for the disabled attribute on the input element
        // This is the most reliable indicator
        const hasDisabledInput = $el.find("input").prop("disabled") === true;

        if (hasDisabledInput) {
          return true;
        }

        // Secondary checks if the input check didn't find it
        // 1. Check for the Mui-disabled class on various elements
        const hasRootDisabledClass = $el.hasClass("Mui-disabled");
        const hasInputBaseDisabledClass = $el
          .find(".MuiInputBase-root")
          .hasClass("Mui-disabled");
        const hasInputDisabledClass = $el
          .find("input")
          .hasClass("Mui-disabled");

        // 2. Check for the aria-disabled attribute
        const hasRootAriaDisabled = $el.attr("aria-disabled") === "true";
        const hasInputAriaDisabled =
          $el.find("input").attr("aria-disabled") === "true";

        // Return true if any of the disabled indicators are found
        return (
          hasDisabledInput ||
          hasRootDisabledClass ||
          hasInputBaseDisabledClass ||
          hasInputDisabledClass ||
          hasRootAriaDisabled ||
          hasInputAriaDisabled
        );
      });
    });
  }

  /**
   * Checks if the autocomplete is currently in a loading state
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the autocomplete is loading
   */
  isLoading(): Cypress.Chainable<boolean> {
    return cy.then(() => {
      return this.get().then(($el) => {
        // Primary check: Look for CircularProgress component
        // MUI CircularProgress has specific class names we can target
        const hasCircularProgress =
          $el.find(".MuiCircularProgress-root").length > 0;

        // Secondary check: Look for SVG circles which are part of CircularProgress
        // CircularProgress renders an SVG with circles
        const hasCircle = $el.find("svg circle").length > 0;

        // Tertiary check: Look for the loading attribute on the Autocomplete component
        // MUI Autocomplete sets aria-busy="true" when loading
        const hasLoadingAttribute = $el.attr("aria-busy") === "true";

        // Additional check: Look for the endAdornment section with a CircularProgress
        // This is where loading indicators are typically placed in Autocomplete
        const hasEndAdornmentLoading =
          $el.find(".MuiAutocomplete-endAdornment .MuiCircularProgress-root")
            .length > 0;

        return (
          hasCircularProgress ||
          hasCircle ||
          hasLoadingAttribute ||
          hasEndAdornmentLoading
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

  /**
   * Gets the label text for this autocomplete
   * @returns Cypress.Chainable<string> - chainable that resolves to the label text
   */
  label(): Cypress.Chainable<string> {
    return cy.then(() => {
      return this.get().then(($el) => {
        // Try to find the label using the 'for' attribute matching the input id
        const inputId = $el.find("input").attr("id");
        if (inputId) {
          const $labelByFor = Cypress.$(`label[for="${inputId}"]`);
          if ($labelByFor.length > 0) {
            return $labelByFor.text();
          }
        }

        // Try to find the label within the form control
        const $formControl = $el.closest(
          ".MuiFormControl-root, .MuiTextField-root"
        );
        if ($formControl.length > 0) {
          const $label = $formControl.find("label");
          if ($label.length > 0) {
            return $label.text();
          }
        }

        // Fallback: try to find any label that might be associated with this component
        const $nearestLabel = $el.prev("label");
        if ($nearestLabel.length > 0) {
          return $nearestLabel.text();
        }

        // If no label is found, return empty string
        return "";
      });
    });
  }

  /**
   * Checks if the autocomplete is required
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if the autocomplete is required
   */
  isRequired(): Cypress.Chainable<boolean> {
    return cy.then(() => {
      return this.get().then(($el) => {
        // Primary check: Check for the required attribute on the input element
        const hasRequiredInput = $el.find("input").prop("required") === true;

        if (hasRequiredInput) {
          return true;
        }

        // Secondary checks if the input check didn't find it
        // 1. Check for the aria-required attribute
        const hasInputAriaRequired =
          $el.find("input").attr("aria-required") === "true";

        // 2. Check for the required attribute on the form control
        const $formControl = $el.closest(".MuiFormControl-root");
        const hasFormControlRequired =
          $formControl.length > 0 &&
          $formControl.find("label").hasClass("Mui-required");

        // 3. Check for asterisk in the label (MUI adds an asterisk to required fields)
        const hasAsteriskInLabel =
          $el.find("label .MuiFormLabel-asterisk").length > 0;

        // Return true if any of the required indicators are found
        return (
          hasRequiredInput ||
          hasInputAriaRequired ||
          hasFormControlRequired ||
          hasAsteriskInLabel
        );
      });
    });
  }
}

/**
 * Factory function to create an AutocompleteInteractable
 * @param dataTestId The data-testid of the autocomplete
 * @param parentElement Optional parent element to scope the autocomplete within
 * @param index Optional index for when multiple autocompletes with the same data-testid exist
 * @returns An AutocompleteInteractable
 */
export function autocomplete(
  dataTestId: string,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>,
  index?: number
): AutocompleteInteractable {
  return new AutocompleteInteractable({
    componentName: "Autocomplete",
    dataTestId,
    parentElement,
    index,
  });
}

export default AutocompleteInteractable;
