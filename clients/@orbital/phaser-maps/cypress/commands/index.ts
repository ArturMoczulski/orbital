// Custom commands for interacting with the TreeExplorer component

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

/**
 * Deletes an object by its name
 * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
 * @param objectName - The name of the object to delete
 */
Cypress.Commands.add(
  "deleteObjectByName",
  (typePrefix: string, objectName: string) => {
    // Intercept the DELETE request
    cy.intercept("DELETE", `/api/admin/${typePrefix}s/*`).as("deleteObject");

    // Find the object by name and get its container
    cy.contains(objectName)
      .parents(`[data-cy^="${typePrefix}-tree-node-"]`)
      .within(() => {
        // Click the delete button within this container
        cy.get(`[data-cy^="${typePrefix}-delete-button-"]`).click();
      });

    // Handle the confirmation dialog
    cy.on("window:confirm", () => true);

    // Wait for the DELETE request to complete
    cy.wait("@deleteObject").then((interception) => {
      cy.log(
        `Delete API Response: ${JSON.stringify(interception.response?.body)}`
      );
      expect(interception.response?.statusCode).to.eq(200);
    });

    // Verify the object is no longer visible
    cy.contains(objectName).should("not.exist");
  }
);

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

      /**
       * Deletes an object by its name
       * @param typePrefix - The prefix for the explorer type (e.g., 'area', 'character')
       * @param objectName - The name of the object to delete
       */
      deleteObjectByName(
        typePrefix: string,
        objectName: string
      ): Chainable<Element>;
    }
  }
}

export {};
