// Custom commands for interacting with the ObjectExplorer component

/**
 * Opens the "Add Object" dialog by clicking the add button
 * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
 */
Cypress.Commands.add("openAddObjectDialog", (typePrefix: string) => {
  cy.get(`[data-cy="${typePrefix}-add-button"]`).click();
});

/**
 * Gets the Add Object dialog element
 * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
 */
Cypress.Commands.add("getAddObjectDialog", (typePrefix: string) => {
  cy.get(`[data-cy="${typePrefix}-add-dialog"]`);
});

/**
 * Gets an input field in the Add Object form by field name
 * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
 * @param fieldName - The name of the input field
 */
Cypress.Commands.add(
  "getAddObjectInput",
  (typePrefix: string, fieldName: string) => {
    cy.get(`[data-cy="${typePrefix}-add-form"]`).find(
      `input[name="${fieldName}"]`
    );
  }
);

/**
 * Gets the submit button in the Add Object form
 * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
 */
Cypress.Commands.add("getAddObjectSubmitButton", (typePrefix: string) => {
  cy.get(`[data-cy="${typePrefix}-add-form"]`).find('button[type="submit"]');
});

// Add TypeScript type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Opens the "Add Object" dialog by clicking the add button
       * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
       */
      openAddObjectDialog(typePrefix: string): Chainable<Element>;

      /**
       * Gets the Add Object dialog element
       * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
       */
      getAddObjectDialog(typePrefix: string): Chainable<Element>;

      /**
       * Gets an input field in the Add Object form by field name
       * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
       * @param fieldName - The name of the input field
       */
      getAddObjectInput(
        typePrefix: string,
        fieldName: string
      ): Chainable<Element>;

      /**
       * Gets the submit button in the Add Object form
       * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
       */
      getAddObjectSubmitButton(typePrefix: string): Chainable<Element>;
    }
  }
}

export {};
