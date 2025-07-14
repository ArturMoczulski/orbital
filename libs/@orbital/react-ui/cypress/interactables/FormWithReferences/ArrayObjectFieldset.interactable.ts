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
   * Get a remove button for a specific item by index
   * @param index The index of the item
   */
  removeButton(index: number): Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Get a remove button for a specific item by object ID
   * @param id The object ID of the item
   */
  removeButton(id: string): Cypress.Chainable<JQuery<HTMLElement>>;

  /**
   * Implementation of removeButton for both index and id overloads
   * @param indexOrId The index or object ID of the item
   */
  removeButton(
    indexOrId: number | string
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    if (typeof indexOrId === "number") {
      // When using index, find the nth ObjectFieldset and get its remove button
      return this.get()
        .find("[data-testid=ObjectFieldset]")
        .eq(indexOrId)
        .siblings("[data-testid=RemoveItem]");
    } else {
      // When using ID, find by data-object-id attribute
      return this.get().find(
        `[data-object-id="${indexOrId}"][data-testid=RemoveItem]`
      );
    }
  }

  /**
   * Get all ObjectFieldset items as an array of ObjectFieldsetInteractable objects
   */
  items(): Cypress.Chainable<ObjectFieldsetInteractable[]> {
    return this.getItemCount().then((count) => {
      const interactables: ObjectFieldsetInteractable[] = [];

      for (let i = 0; i < count; i++) {
        // Create an ObjectFieldsetInteractable for each item
        interactables.push(
          objectFieldset(
            this.objectType, // Object type is stored in data-object-type
            undefined,
            undefined, // Don't use objectId when using index
            i // Use the index to find the correct ObjectFieldset
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
      return cy.wrap(
        objectFieldset(
          this.objectType, // Object type is stored in data-object-type
          undefined,
          undefined, // Don't use objectId when using index
          indexOrId // Use the index to find the correct ObjectFieldset
        )
      );
    } else {
      // If a string is provided, use it as an ID
      return cy.wrap(
        objectFieldset(
          this.objectType, // Object type is stored in data-object-type
          undefined,
          indexOrId, // Use the string as the objectId
          undefined // Don't use index when using objectId
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
   * Remove an item by index or object ID
   * @param indexOrId The index or object ID of the item to remove
   */
  removeItem(indexOrId: number | string): this {
    this.removeButton(indexOrId as any).click();
    return this;
  }

  /**
   * Get the number of items
   */
  getItemCount(): Cypress.Chainable<number> {
    // Find all ObjectFieldset elements within the ArrayObjectFieldset
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
      // Check for error text - look for Typography with color="error" attribute
      // This can appear in different ways in the DOM:
      // 1. As a class .MuiTypography-colorError
      // 2. As an attribute [color="error"]
      // 3. Or the component might have the error prop set directly

      const hasErrorClass = $el.find(".MuiTypography-colorError").length > 0;
      const hasErrorAttr = $el.find('[color="error"]').length > 0;
      const hasErrorProp = $el.attr("error") === "true";

      return cy.wrap(hasErrorClass || hasErrorAttr || hasErrorProp);
    });
  }

  /**
   * Get the error message if any
   */
  getErrorMessage(): Cypress.Chainable<string | null> {
    return this.get().then(($el) => {
      // Look for error text in multiple possible locations
      let errorText: string | null = null;

      // Check for MUI error typography
      const $errorEl = $el.find(".MuiTypography-colorError");
      if ($errorEl.length > 0) {
        errorText = $errorEl.text();
      }

      // If not found, try finding by color="error" attribute
      if (!errorText) {
        const $errorAttrEl = $el.find('[color="error"]');
        if ($errorAttrEl.length > 0) {
          errorText = $errorAttrEl.text();
        }
      }

      // If we have an error prop but no visible error message, return a default
      if (!errorText && $el.attr("error") === "true") {
        errorText = "Error";
      }

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
