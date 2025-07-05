// ObjectExplorer Cypress Helpers
// This file provides a fluent API for interacting with the ObjectExplorer component in tests

// Import the CypressInteractable base class
import { CypressInteractable } from "../../../cypress/interactables/Cypress.interactable";
// Import the DialogInteractable classes
import { ZodObjectSchema } from "../../../cypress/interactables/Dialog/FormDialog/FormDialog.interactable";
// Import the ObjectExplorerAddDialog class
import { AddItemDialogInteractable } from "./AddItemDialog.interactable";
// Import TreeNodeInteractable
import { TreeNodeInteractable } from "./TreeNode.interactable";
// Import Zod for schema handling
import { z } from "zod";

/**
 * Interface for dialog-related methods
 */
interface TreeExplorerDialogs<
  CustomActions extends string = never,
  Schema extends ZodObjectSchema = never,
> {
  /**
   * The Add dialog as an ObjectExplorerAddDialog
   */
  add: AddItemDialogInteractable<Schema, CustomActions>;
}

/**
 * Interface for button-related methods
 */
interface ObjectExplorerButtons<CustomActions extends string = never> {
  /**
   * Get the Add button element
   */
  add: () => Cypress.Chainable;

  /**
   * Get the Add button element in the empty state
   */
  addEmpty: () => Cypress.Chainable;
}

/**
 * Interface for state-related methods
 */
interface ObjectExplorerStates<
  CustomActions extends string = never,
  Schema extends ZodObjectSchema = never,
> {
  loading: {
    /**
     * Get the loading state element
     */
    getElement: () => Cypress.Chainable;

    /**
     * Check if the explorer is in loading state
     */
    shouldExist: () => TreeExplorerInteractable<CustomActions, Schema>;
  };

  error: {
    /**
     * Get the error state element
     */
    getElement: () => Cypress.Chainable;

    /**
     * Check if the explorer is in error state
     */
    shouldExist: () => TreeExplorerInteractable<CustomActions, Schema>;
  };

  empty: {
    /**
     * Get the empty state element
     */
    getElement: () => Cypress.Chainable;

    /**
     * Check if the explorer is in empty state
     */
    shouldExist: () => TreeExplorerInteractable<CustomActions, Schema>;

    /**
     * Click the Add button in empty state
     */
    add: () => TreeExplorerInteractable<CustomActions, Schema>;
  };
}

/**
 * ObjectExplorerInteractable class represents the ObjectExplorer component
 * and provides methods for interacting with it
 */
class TreeExplorerInteractable<
  CustomActions extends string = never,
  Schema extends ZodObjectSchema = never,
> extends CypressInteractable<string> {
  readonly typePrefixPascal: string;
  readonly customActions?: CustomActions[];
  readonly schema: Schema;

  /**
   * Dialog-related methods organized in a nested structure
   */
  readonly dialogs: TreeExplorerDialogs<CustomActions, Schema>;

  /**
   * Button-related methods organized in a nested structure
   */
  readonly buttons: ObjectExplorerButtons<CustomActions>;

  /**
   * State-related methods organized in a nested structure
   */
  readonly states: ObjectExplorerStates<CustomActions, Schema>;

  constructor(
    typePrefixPascal: string,
    schema: Schema,
    customActions?: CustomActions[]
  ) {
    super(`ObjectExplorer`); // Pass the base component type to the parent class
    this.typePrefixPascal = typePrefixPascal;
    this.schema = schema;
    this.customActions = customActions;

    // Initialize the buttons property
    this.buttons = {
      add: () => this.getElement().find('[data-testid="AddButton"]'),
      addEmpty: () => this.getElement().find('[data-testid="AddButtonEmpty"]'),
    };

    // Initialize the dialogs property with ObjectExplorerAddDialog
    this.dialogs = {
      add: new AddItemDialogInteractable<Schema, CustomActions>(
        this, // Pass the explorer instance
        schema // Schema for the form
      ),
    };

    // Initialize the states property with more specific selectors
    this.states = {
      loading: {
        getElement: () => {
          // Use the ObjectExplorer prefixed selector for components outside the main structure
          return cy
            .get('[data-testid="ObjectExplorerLoadingState"]')
            .should("exist");
        },
        shouldExist: () => {
          this.states.loading.getElement().should("exist");
          return this;
        },
      },
      error: {
        getElement: () => {
          // Use the ObjectExplorer prefixed selector for components outside the main structure
          return cy
            .get('[data-testid="ObjectExplorerErrorState"]')
            .should("exist");
        },
        shouldExist: () => {
          this.states.error.getElement().should("exist");
          return this;
        },
      },
      empty: {
        getElement: () => this.getElement().find('[data-testid="EmptyState"]'),
        shouldExist: () => {
          this.states.empty.getElement().should("exist");
          return this;
        },
        add: () => {
          this.buttons.addEmpty().click();
          return this;
        },
      },
    };
  }

  /**
   * Override the getElement method to use the specific ObjectExplorer selector
   */
  override getElement() {
    // The data-testid format in the component is "ObjectExplorer ${typePrefixPascal}Explorer"
    // For example: "ObjectExplorer ItemExplorer"
    // But for more flexibility, we'll use a partial match
    return cy.get(`[data-testid^="ObjectExplorer"]`).should("exist");
  }

  /**
   * Select a tree node in this explorer by name
   */
  item(name: string): TreeNodeInteractable<CustomActions, Schema> {
    return new TreeNodeInteractable<CustomActions, Schema>(this, name);
  }

  /**
   * Check the number of root items in the explorer
   */
  shouldHaveRootItemCount(
    count: number
  ): TreeExplorerInteractable<CustomActions, Schema> {
    this.getElement()
      .find('[data-testid="TreeNode"]')
      .filter((_, el) => {
        // Check if this is a root-level node (no margin-left)
        const style = window.getComputedStyle(el);
        return style.marginLeft === "0px" || style.marginLeft === "";
      })
      .should("have.length", count);
    return this;
  }

  /**
   * Check the total number of items in the explorer
   */
  shouldHaveTotalItemCount(
    count: number
  ): TreeExplorerInteractable<CustomActions, Schema> {
    this.getElement()
      .find('[data-testid="TreeNode"]')
      .should("have.length", count);
    return this;
  }

  /**
   * Add a new item to the explorer
   * This method encapsulates the entire workflow:
   * 1. Click the appropriate Add button (regular or empty state)
   * 2. Fill out the form with the provided properties
   * 3. Submit the form
   */
  add(data: {
    name: string;
    parentId?: string;
  }): TreeExplorerInteractable<CustomActions, Schema> {
    this.dialogs.add.open();
    return this.dialogs.add.submitAndReturnExplorer(
      data as Partial<z.infer<Schema>>
    );
  }
}

/**
 * Create an ObjectExplorer helper for interacting with the component
 * @param typePrefixPascal The PascalCase type prefix (e.g., "Area", "World")
 * @returns An ObjectExplorerInteractable instance
 */
function treeExplorer<
  T extends string = never,
  S extends ZodObjectSchema = never,
>(
  typePrefixPascal: string,
  schema?: S,
  customActions?: T[]
): TreeExplorerInteractable<T, S> {
  // Use the provided schema or fall back to the default schema
  const finalSchema = schema as S;

  return new TreeExplorerInteractable<T, S>(
    typePrefixPascal,
    finalSchema,
    customActions
  );
}

// Export the helper function, classes, and types
export { treeExplorer, TreeExplorerInteractable, type ZodObjectSchema };
