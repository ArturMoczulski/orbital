// ObjectExplorer Cypress Helpers
// This file provides a fluent API for interacting with the ObjectExplorer component in tests

// Import the CypressInteractable base class
import { CypressInteractable } from "../../../cypress/support/CypressInteractable";

/**
 * TreeNode class represents a node in the ObjectExplorer tree
 * and provides methods for interacting with it
 */
class TreeNodeInteractable extends CypressInteractable<string> {
  private explorer: ObjectExplorerInteractable;
  private name: string;

  constructor(explorer: ObjectExplorerInteractable, name: string) {
    super("TreeNode"); // Pass the base component type to the parent class
    this.explorer = explorer;
    this.name = name;
  }

  /**
   * Override findElement to use the explorer's getElement method for proper scoping
   */
  protected override findElement() {
    return this.explorer
      .getElement()
      .find(`[data-testid="TreeNode"]`)
      .contains(this.name)
      .should("exist");
  }

  // click() and hover() methods are now inherited from CypressInteractable

  /**
   * Delete this item
   */
  delete(): TreeNodeInteractable {
    // First hover over the item to make the delete button visible
    this.hover();

    // Stub the window.confirm to always return true
    cy.on("window:confirm", () => true);

    // Find and click the delete button using the explorer's element for scoping
    this.explorer
      .getElement()
      .contains(this.name)
      .closest('[data-testid="TreeNode"]')
      .find('[data-testid="DeleteButton"]')
      .should("exist")
      .click({ force: true });

    return this;
  }

  /**
   * Perform a custom action on this item
   */
  action(actionName: string): TreeNodeInteractable {
    // First hover over the item to make the action buttons visible
    this.hover();

    // Try to find the action button using the explorer's element for scoping
    this.explorer
      .getElement()
      .contains(this.name)
      .closest('[data-testid="TreeNode"]')
      .find(`[data-testid="${actionName}"]`)
      .should("exist")
      .click({ force: true });

    return this;
  }

  // getElement() is now inherited from CypressInteractable
}

/**
 * ObjectExplorerInteractable class represents the ObjectExplorer component
 * and provides methods for interacting with it
 */
class ObjectExplorerInteractable extends CypressInteractable<string> {
  readonly typePrefixPascal: string;

  constructor(typePrefixPascal: string) {
    super(`ObjectExplorer`); // Pass the base component type to the parent class
    this.typePrefixPascal = typePrefixPascal;
  }

  /**
   * Override the getElement method to use the specific ObjectExplorer selector
   */
  override getElement() {
    return cy
      .get(`[data-testid="ObjectExplorer ${this.typePrefixPascal}Explorer"]`)
      .should("exist");
  }

  /**
   * Select a tree node in this explorer by name
   */
  item(name: string): TreeNodeInteractable {
    return new TreeNodeInteractable(this, name);
  }
}

/**
 * Create an ObjectExplorer helper for interacting with the component
 * @param typePrefixPascal The PascalCase type prefix (e.g., "Area", "World")
 * @returns An ObjectExplorerInteractable instance
 */
function objectExplorer(typePrefixPascal: string): ObjectExplorerInteractable {
  return new ObjectExplorerInteractable(typePrefixPascal);
}

// Export the helper function and classes
export { objectExplorer, ObjectExplorerInteractable, TreeNodeInteractable };
