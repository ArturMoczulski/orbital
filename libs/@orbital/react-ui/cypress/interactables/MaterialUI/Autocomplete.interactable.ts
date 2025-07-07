import { Listable, Selectable } from "../interfaces/Listable";
import { Openable } from "../interfaces/Openable";
import { Typeable } from "../interfaces/Typeable";
import { Validatable } from "../interfaces/Validatable";
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
   * Gets the trigger element that opens the autocomplete
   * Delegates to the internal popper instance
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - chainable that resolves to the trigger element
   */
  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.popper.getTriggerElement();
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
   * Gets the currently selected item(s) from the autocomplete
   * @returns Cypress.Chainable<string | string[]> - chainable that resolves to the selected text or array of selected texts
   */
  selected(): Cypress.Chainable<string | string[]> {
    // Use a completely different approach to avoid TypeScript errors
    // First check for single selection (input value)
    return cy.then(() => {
      return this.get()
        .find("input")
        .invoke("val")
        .then((value) => {
          if (value) {
            // If we have an input value, return it as a string
            return value as string;
          } else {
            // Otherwise, check for chips (multiple selection)
            return this.get()
              .find(".MuiChip-label")
              .then(($chips) => {
                if ($chips.length > 0) {
                  // Multiple selection - collect chip texts
                  const chipTexts: string[] = [];
                  $chips.each((_, chip) => {
                    chipTexts.push(Cypress.$(chip).text());
                  });
                  return chipTexts;
                } else {
                  // Fallback - return empty string
                  return "";
                }
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
    this.getTriggerElement().clear().type(text);
    cy.wait(100); // Wait for the typing to be processed
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
