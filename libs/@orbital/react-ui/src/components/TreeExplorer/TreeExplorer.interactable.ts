// TreeExplorer Cypress Helpers
// This file provides a fluent API for interacting with the TreeExplorer component in tests

// Import the CypressInteractable base class
import { CypressInteractable } from "../../../cypress/interactables/Cypress.interactable";
// Import the DialogInteractable classes
import { ZodObjectSchema } from "../../../cypress/interactables/Dialog/FormDialog/FormDialog.interactable";
// Import the TreeExplorerAddDialog class
import { AddBranchDialogInteractable } from "./AddBranchDialog.interactable";
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
   * The Add dialog as an TreeExplorerAddDialog
   */
  add: AddBranchDialogInteractable<Schema, CustomActions>;
}

/**
 * Interface for button-related methods
 */
interface TreeExplorerButtons<CustomActions extends string = never> {
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
interface TreeExplorerStates<
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
 * TreeExplorerInteractable class represents the TreeExplorer component
 * and provides methods for interacting with it
 */
/**
 * TreeExplorerInteractable class represents the TreeExplorer component
 * and provides methods for interacting with it
 *
 * @template CustomActions - String literal type representing available custom actions
 *                          When using treeExplorer(), this is inferred from the customActions array
 * @template Schema - Zod schema for form validation
 */
class TreeExplorerInteractable<
  CustomActions extends string = never,
  Schema extends ZodObjectSchema = never,
> extends CypressInteractable<string> {
  readonly typePrefixPascal: string;

  /**
   * Array of custom action names available for tree nodes
   * When passed to treeExplorer(), this array's string literals become the CustomActions type
   */
  readonly customActions?: CustomActions[];

  readonly schema: Schema;

  /**
   * Dialog-related methods organized in a nested structure
   */
  readonly dialogs: TreeExplorerDialogs<CustomActions, Schema>;

  /**
   * Button-related methods organized in a nested structure
   */
  readonly buttons: TreeExplorerButtons<CustomActions>;

  /**
   * State-related methods organized in a nested structure
   */
  readonly states: TreeExplorerStates<CustomActions, Schema>;

  constructor(
    typePrefixPascal: string,
    schema: Schema,
    customActions?: CustomActions[]
  ) {
    super(`TreeExplorer`); // Pass the base component type to the parent class
    this.typePrefixPascal = typePrefixPascal;
    this.schema = schema;
    this.customActions = customActions;

    // Initialize the buttons property
    this.buttons = {
      add: () => this.getElement().find('[data-testid="AddButton"]'),
      addEmpty: () => this.getElement().find('[data-testid="AddButtonEmpty"]'),
    };

    // Initialize the dialogs property with TreeExplorerAddDialog
    this.dialogs = {
      add: new AddBranchDialogInteractable<Schema, CustomActions>(
        this, // Pass the explorer instance
        schema // Schema for the form
      ),
    };

    // Initialize the states property with more specific selectors
    this.states = {
      loading: {
        getElement: () => {
          // Use the TreeExplorer prefixed selector for components outside the main structure
          return cy
            .get('[data-testid="TreeExplorerLoadingState"]')
            .should("exist");
        },
        shouldExist: () => {
          this.states.loading.getElement().should("exist");
          return this;
        },
      },
      error: {
        getElement: () => {
          // Use the TreeExplorer prefixed selector for components outside the main structure
          return cy
            .get('[data-testid="TreeExplorerErrorState"]')
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
   * Override the getElement method to use the specific TreeExplorer selector
   */
  override getElement() {
    // The data-testid format in the component is "TreeExplorer ${typePrefixPascal}Explorer"
    // For example: "TreeExplorer ItemExplorer"
    // But for more flexibility, we'll use a partial match
    return cy.get(`[data-testid^="TreeExplorer"]`).should("exist");
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
 * Create an TreeExplorer helper for interacting with the component
 * @param typePrefixPascal The PascalCase type prefix (e.g., "Area", "World")
 * @param schema The Zod schema for form validation
 * @param customActions Array of custom action names that will be available on tree nodes
 *                     The string literals in this array are used to infer the CustomActions type
 *                     Example: ["edit", "delete"] creates type "edit" | "delete"
 * @returns An TreeExplorerInteractable instance with type-safe custom actions
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
