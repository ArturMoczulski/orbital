import { FormInputInteractableOptions } from "../AutoForm/FormInput.interactable";
import { Listable, Selectable } from "../interfaces/Listable";
import { Loadable } from "../interfaces/Loadable";
import { Openable } from "../interfaces/Openable";
import { Typeable } from "../interfaces/Typeable";
import { Validatable } from "../interfaces/Validatable";
import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";
import { ChipInteractable } from "../MaterialUI/Chip.interactable";
import { ObjectSelectorInteractable } from "../ObjectSelector/ObjectSelector.interactable";

/**
 * ReferenceFieldInteractable class uses composition to delegate to AutocompleteInteractable
 * while extending FormInputInteractable for form field functionality.
 * ReferenceField can be either single-select or multi-select based on the multiple prop.
 */
/**
 * Options for ReferenceFieldInteractable
 */
export interface ReferenceFieldInteractableOptions
  extends FormInputInteractableOptions {
  /**
   * The type of object this reference field is for (e.g., "User", "Post")
   */
  objectType: string;

  /**
   * Optional object ID to further scope the field
   */
  objectId?: string;

  /**
   * Optional index for when multiple fields with the same name exist
   */
  index?: number;

  multiple?: boolean;
}

export class ReferenceFieldInteractable
  extends ObjectSelectorInteractable
  implements Openable, Listable, Selectable, Typeable, Validatable, Loadable
{
  /**
   * The type of object this reference field is for (e.g., "User", "Post")
   */
  protected objectType: string;

  /**
   * Internal AutocompleteInteractable instance for delegation
   */
  protected autocomplete: AutocompleteInteractable;

  /**
   * Constructor for ReferenceFieldInteractable
   * @param options Options for creating the reference field interactable
   */
  constructor(options: ReferenceFieldInteractableOptions) {
    super(options);
    this.objectType = options.objectType;

    // Create internal AutocompleteInteractable instance
    this.autocomplete = new AutocompleteInteractable({
      componentName: "Autocomplete",
      fieldName: options.fieldName,
      parentElement: options.parentElement,
      index: options.index,
    });
  }

  selector() {
    let selector = "";

    if (this.htmlElementType) {
      selector += `${this.htmlElementType}`;
    }

    if (this.dataTestId) {
      selector += `[data-testid="${this.dataTestId}"]`;
    }

    if (this.fieldName) {
      selector += `[data-field-name="${this.fieldName}"]`;
    }

    if (!selector) {
      // This should never happen due to the validation in the constructor
      throw new Error("Not enough selectors to find components");
    }

    return selector;
  }

  /**
   * Implementation of selectById from FormInputInteractable
   * Delegates to the select method of AutocompleteInteractable
   */
  selectById(value: string | string[]): Cypress.Chainable<JQuery<HTMLElement>> {
    if (Array.isArray(value)) {
      // For multiple selection, we need to select each value
      value.forEach((val) => {
        this.autocomplete.selectById(val);
      });
      return this.get();
    } else {
      // For single selection
      this.autocomplete.selectById(value);
      return this.get();
    }
  }

  /**
   * Get the DOM element for this component
   * This method is required because we're extending FormInputInteractable
   */
  get(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.get();
  }

  // Delegate Openable methods to internal autocomplete instance
  open(): Cypress.Chainable<void> {
    return this.autocomplete.open();
  }

  close(): Cypress.Chainable<void> {
    return this.autocomplete.close();
  }

  isOpened(): Cypress.Chainable<boolean> {
    return this.autocomplete.isOpened();
  }

  isClosed(): Cypress.Chainable<boolean> {
    return this.autocomplete.isClosed();
  }

  getTriggerElement(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.getTriggerElement();
  }

  trigger(): this {
    this.autocomplete.trigger();
    return this;
  }

  isTriggered(): Cypress.Chainable<boolean> {
    return this.autocomplete.isTriggered();
  }

  // Delegate Listable methods to internal autocomplete instance
  items(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.items();
  }

  item(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.item(text);
  }

  /**
   * Gets a specific option element by its ID attribute
   * Delegates to the autocomplete's itemById method
   * @param id - The ID to search for
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the found option element
   */
  itemById(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.itemById(id);
  }

  select(text: string | string[]) {
    this.autocomplete.select(text);
    return this;
  }

  /**
   * Gets the listbox element that contains the options
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the listbox element
   */
  protected getListbox(): Cypress.Chainable<JQuery<HTMLElement>> {
    // We need to open the dropdown first
    return this.open().then(() => {
      // Then find the listbox within the popper
      return cy.get('[role="presentation"]').find('[role="listbox"]');
    });
  }

  /**
   * Checks if this is a multiple selection autocomplete
   * Delegates to the autocomplete's isMultipleSelection method
   * @returns Cypress.Chainable<boolean> - chainable that resolves to true if this is a multiple selection autocomplete
   */
  protected isMultipleSelection(): Cypress.Chainable<boolean> {
    return cy.wrap(null).then(() => {
      // First check for chips which is the most reliable visual indicator
      return this.get().then(($el) => {
        // Check for chips (which only appear in multiple selection)
        const hasChips = $el.find(".MuiChip-root").length > 0;

        if (hasChips) {
          // If we have chips, we know it's multiple selection without opening dropdown
          return true;
        }

        // Check for multiple selection indicators
        const hasMultipleRoot = $el.attr("data-multiple") === "true";
        const hasMultipleAttr =
          $el.find('input[aria-multiselectable="true"]').length > 0;

        return hasMultipleRoot || hasMultipleAttr;
      });
    });
  }

  selected(): Cypress.Chainable<string | string[]> {
    return this.autocomplete.selected();
  }

  clearSelection(): this {
    // For single selection, we need to ensure the onChange is called with empty string
    this.isMultipleSelection().then((isMultiple) => {
      // Delegate to the autocomplete's clearSelection method
      // This should naturally trigger the onChange event through the component
      this.autocomplete.clearSelection();

      // Verify the input is cleared
      this.textField().invoke("val").should("eq", "");
    });

    return this;
  }

  deselect(text: string): this {
    this.autocomplete.deselect(text);
    return this;
  }

  // Delegate Typeable methods to internal autocomplete instance
  type(text: string): this {
    this.autocomplete.type(text);
    return this;
  }

  clearTextInput(): this {
    this.autocomplete.clearTextInput();
    return this;
  }

  // Delegate Validatable methods to internal autocomplete instance
  hasError(): Cypress.Chainable<boolean> {
    return this.autocomplete.hasError();
  }

  getError(): Cypress.Chainable<string> {
    return this.autocomplete.getError();
  }

  // Delegate Loadable methods to internal autocomplete instance
  isLoading(): Cypress.Chainable<boolean> {
    return this.autocomplete.isLoading();
  }

  // Additional methods from AutocompleteInteractable that are used in tests
  textField(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.autocomplete.textField();
  }

  chips(): Cypress.Chainable<ChipInteractable[]> {
    return this.autocomplete.chips();
  }

  // Add a label method that's used in the tests
  label(): Cypress.Chainable<string> {
    // Delegate to the autocomplete's label method
    return this.autocomplete.label();
  }

  // Override isRequired and isDisabled to use the autocomplete methods
  isRequired(): Cypress.Chainable<boolean> {
    // Use super.isRequired() since AutocompleteInteractable doesn't have isRequired
    return super.isRequired();
  }

  isDisabled(): Cypress.Chainable<boolean> {
    return this.autocomplete.isDisabled();
  }

  /**
   * Override getValue to return the actual value (ID) of the selected option
   * This ensures we get the correct value from the form field
   */
  getValue(): Cypress.Chainable<string | string[]> {
    return this.autocomplete.selected();
  }
}

/**
 * Factory function to create a ReferenceField interactable
 * @param options Options for creating the reference field interactable
 * @returns A ReferenceField interactable
 */
export function referenceField(
  options: ReferenceFieldInteractableOptions
): ReferenceFieldInteractable {
  return new ReferenceFieldInteractable(options);
}

// Export the factory function and class
export default referenceField;
