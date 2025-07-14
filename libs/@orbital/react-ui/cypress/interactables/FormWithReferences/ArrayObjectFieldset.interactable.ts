import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";
import {
  objectFieldset,
  ObjectFieldsetInteractable,
} from "./ObjectFieldset.interactable";

/**
 * Options for ArrayObjectFieldsetInteractable
 */
export interface ArrayObjectFieldsetInteractableOptions
  extends CypressInteractableOptions {
  /**
   * Optional index for when multiple fieldsets with the same selector exist
   */
  index?: number;

  /**
   * The type of object in the array
   */
  objectType: string;
}

/**
 * Interactable for the ArrayObjectFieldset component
 */
export class ArrayObjectFieldsetInteractable extends CypressInteractable {
  /**
   * Constructor for ArrayObjectFieldsetInteractable
   * @param selector The selector for the ArrayObjectFieldset
   * @param options Additional options for the interactable
   */
  constructor(options: ArrayObjectFieldsetInteractableOptions) {
    super({
      dataTestId: "ArrayObjectFieldset",
      index: options.index,
      parentElement: options.parentElement,
    });

    // Store the object type
    this.objectType = options.objectType;
  }

  /**
   * The object type for this array
   */
  protected objectType: string;

  /**
   * Get the add item button
   */
  get addButton() {
    return this.get().find("[data-testid=AddItem]");
  }

  /**
   * Get a remove button for a specific item
   * @param index The index of the item
   */
  removeButton(index: number) {
    return this.get().find(
      `[data-object-id="${this.objectType}-${index}"][data-testid=RemoveItem]`
    );
  }

  /**
   * Get all ObjectFieldset items as an array of ObjectFieldsetInteractable objects
   */
  items(): Cypress.Chainable<ObjectFieldsetInteractable[]> {
    return this.getItemCount().then((count) => {
      const interactables: ObjectFieldsetInteractable[] = [];

      for (let i = 0; i < count; i++) {
        // Create a parent element function that returns the ArrayObjectFieldset itself
        const parentElement = () => this.get();

        // Create an ObjectFieldsetInteractable with the correct index
        interactables.push(
          objectFieldset(
            this.objectType,
            parentElement,
            undefined, // No objectId
            i
          )
        );
      }

      return cy.wrap(interactables);
    });
  }

  /**
   * Get an ObjectFieldset for a specific item
   * @param indexOrId The index or ID of the item
   */
  item(
    indexOrId: number | string
  ): Cypress.Chainable<ObjectFieldsetInteractable> {
    if (typeof indexOrId === "number") {
      // If a number is provided, use it as an index
      return this.items().then((items) => items[indexOrId]);
    } else {
      // If a string is provided, use it as an ID
      // Create a parent element function that returns the ArrayObjectFieldset itself
      const parentElement = () => this.get();

      // Create an ObjectFieldsetInteractable with the specific object ID
      return cy.wrap(
        objectFieldset(
          this.objectType,
          parentElement,
          indexOrId // Use the string as the objectId
        )
      );
    }
  }

  /**
   * Add a new item
   */
  addItem() {
    this.addButton.click();
    return this;
  }

  /**
   * Remove an item
   * @param index The index of the item to remove
   */
  removeItem(index: number) {
    this.removeButton(index).click();
    return this;
  }

  /**
   * Get the number of items
   */
  getItemCount(): Cypress.Chainable<number> {
    // Find all elements with data-testid="ObjectFieldset" within the ArrayObjectFieldset
    return this.get().find("[data-testid=ObjectFieldset]").its("length");
  }

  /**
   * Check if the fieldset is disabled
   */
  isDisabled(): Cypress.Chainable<boolean> {
    return this.get().then(($el) => {
      // Check for the add button - if it doesn't exist, the fieldset is likely disabled
      const addButtonExists = $el.find("[data-testid=AddItem]").length > 0;
      return cy.wrap(!addButtonExists);
    });
  }

  /**
   * Check if the fieldset is in read-only mode
   */
  isReadOnly(): Cypress.Chainable<boolean> {
    // Same check as isDisabled for now, since both hide the add/remove buttons
    return this.isDisabled();
  }

  /**
   * Check if the fieldset has an error
   */
  hasError(): Cypress.Chainable<boolean> {
    return this.get().then(($el) => {
      // Check for error text
      const hasErrorText = $el.find(".MuiTypography-colorError").length > 0;
      return cy.wrap(hasErrorText);
    });
  }

  /**
   * Get the error message if any
   */
  getErrorMessage(): Cypress.Chainable<string | null> {
    return this.get().then(($el) => {
      const $errorEl = $el.find(".MuiTypography-colorError");
      const errorText = $errorEl.length > 0 ? $errorEl.text() : null;
      return cy.wrap(errorText);
    });
  }
}

/**
 * Create an ArrayObjectFieldset interactable
 * @param selector The selector for the ArrayObjectFieldset
 * @param options Additional options for the interactable
 */
export function arrayObjectFieldset(
  selectorOrOptions?: string | Partial<ArrayObjectFieldsetInteractableOptions>,
  optionsParam?: Partial<ArrayObjectFieldsetInteractableOptions>
): ArrayObjectFieldsetInteractable {
  // Handle backward compatibility
  let options: ArrayObjectFieldsetInteractableOptions;

  if (typeof selectorOrOptions === "string") {
    // Old style: first param is selector, second is options
    options = {
      ...(optionsParam || {}),
      dataTestId: selectorOrOptions,
      objectType: "ObjectFieldset", // Default object type for backward compatibility
    } as ArrayObjectFieldsetInteractableOptions;
  } else if (selectorOrOptions) {
    // New style: first param is options
    options = {
      ...(selectorOrOptions || {}),
      objectType: (selectorOrOptions as any)?.objectType || "ObjectFieldset",
    } as ArrayObjectFieldsetInteractableOptions;
  } else {
    // No params: use defaults
    options = {
      dataTestId: "ArrayObjectFieldset",
      objectType: "ObjectFieldset",
    } as ArrayObjectFieldsetInteractableOptions;
  }

  return new ArrayObjectFieldsetInteractable(options);
}

// Export the factory function and class
export default arrayObjectFieldset;
