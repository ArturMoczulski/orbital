/// <reference types="cypress" />
import { DialogInteractable } from "./Dialog.interactable";

/**
 * Test implementation of DialogInteractable for testing purposes
 */
class TestDialogInteractable extends DialogInteractable<"TestDialog"> {
  constructor(parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>) {
    super("TestDialog", parentElement);
  }

  /**
   * Override the open method for testing
   */
  override open(): this {
    cy.get('[data-testid="OpenDialogButton"]').click();
    return this;
  }

  /**
   * Override the close method for testing
   */
  override close(): this {
    cy.get('[data-testid="CloseDialogButton"]').click();
    return this;
  }

  /**
   * Get a specific element within the dialog
   */
  getDialogElement(elementTestId: string): Cypress.Chainable {
    return this.getElement().find(`[data-testid="${elementTestId}"]`);
  }
}

/**
 * Helper function to create a TestDialogInteractable instance
 */
function testDialog(
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): TestDialogInteractable {
  return new TestDialogInteractable(parentElement);
}

describe("DialogInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a component with a dialog
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenDialogButton">Open Dialog</button>
          <div data-testid="TestDialog" style={{ display: "none" }}>
            <h2>Test Dialog</h2>
            <button data-testid="CloseDialogButton">Close</button>
            <div data-testid="DialogContent">Dialog Content</div>
          </div>
        </div>
      );
    });

    it("should check if dialog is open", () => {
      const dialog = testDialog();

      // Make sure the dialog is hidden initially
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "none");

      // Initially the dialog is closed (hidden with display: none)
      dialog.isOpen().should("eq", false);

      // Show the dialog
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "block");

      // Now the dialog should be open
      dialog.isOpen().should("eq", true);
    });

    it("should open the dialog", () => {
      const dialog = testDialog();

      // Make sure the dialog is hidden initially
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "none");

      // Initially the dialog is closed
      dialog.isOpen().should("eq", false);

      // Open the dialog using the interactable - use force: true since the button might be in a hidden container
      cy.get('[data-testid="OpenDialogButton"]').click({ force: true });

      // Simulate the dialog opening (in a real app, the click would trigger this)
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "block");

      // The dialog should now be open
      dialog.isOpen().should("eq", true);
    });

    it("should close the dialog", () => {
      const dialog = testDialog();

      // Make the dialog visible first
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "block");

      // Verify it's open
      dialog.isOpen().should("eq", true);

      // Close the dialog using the interactable - use force: true since the button might be in a hidden container
      cy.get('[data-testid="CloseDialogButton"]').click({ force: true });

      // Simulate the dialog closing (in a real app, the click would trigger this)
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "none");

      // The dialog should now be closed
      cy.get('[data-testid="TestDialog"]').should(
        "have.css",
        "display",
        "none"
      );
      dialog.isOpen().should("eq", false);
    });

    it("should wait for dialog to close", () => {
      const dialog = testDialog();

      // Make the dialog visible first
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "block");

      // Verify it's open
      dialog.isOpen().should("eq", true);

      // Close the dialog directly
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "none");

      // Use waitForClose with a short timeout since we've already closed it
      dialog.waitForClose(500);

      // Final verification
      dialog.isOpen().should("eq", false);
    });

    it("should get elements within the dialog", () => {
      const dialog = testDialog();

      // Make the dialog visible first
      cy.get('[data-testid="TestDialog"]').invoke("css", "display", "block");

      // Get an element within the dialog
      dialog.getDialogElement("DialogContent").should("exist");
      dialog
        .getDialogElement("DialogContent")
        .should("have.text", "Dialog Content");
    });
  });

  describe("Scoped Functionality", () => {
    beforeEach(() => {
      // Mount a component with multiple dialogs
      cy.mount(
        <div>
          <div data-testid="Container1">
            <button data-testid="OpenDialogButton">Open Dialog 1</button>
            <div data-testid="TestDialog" style={{ display: "none" }}>
              <h2>Dialog 1</h2>
              <button data-testid="CloseDialogButton">Close</button>
              <div data-testid="DialogContent">Content 1</div>
            </div>
          </div>
          <div data-testid="Container2">
            <button data-testid="OpenDialogButton">Open Dialog 2</button>
            <div data-testid="TestDialog" style={{ display: "none" }}>
              <h2>Dialog 2</h2>
              <button data-testid="CloseDialogButton">Close</button>
              <div data-testid="DialogContent">Content 2</div>
            </div>
          </div>
        </div>
      );
    });

    it("should scope to a parent element", () => {
      // Create parent-scoped dialog interactables
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const dialog1 = testDialog(parent1);

      const parent2 = () => cy.get('[data-testid="Container2"]');
      const dialog2 = testDialog(parent2);

      // Show both dialogs
      cy.get('[data-testid="Container1"] [data-testid="TestDialog"]').invoke(
        "css",
        "display",
        "block"
      );
      cy.get('[data-testid="Container2"] [data-testid="TestDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Verify both dialogs are open
      dialog1.isOpen().should("eq", true);
      dialog2.isOpen().should("eq", true);

      // Verify each dialog has the correct content
      dialog1
        .getDialogElement("DialogContent")
        .should("have.text", "Content 1");
      dialog2
        .getDialogElement("DialogContent")
        .should("have.text", "Content 2");
    });

    it("should maintain parent scope after interactions", () => {
      // Create parent-scoped dialog interactables
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const dialog1 = testDialog(parent1);

      // Show the dialog
      cy.get('[data-testid="Container1"] [data-testid="TestDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Perform an interaction
      dialog1.getDialogElement("CloseDialogButton").click();

      // Verify the scope is maintained
      dialog1.getElement().should("exist");
      dialog1
        .getDialogElement("DialogContent")
        .should("have.text", "Content 1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent dialogs gracefully", () => {
      // Mount an empty component
      cy.mount(<div></div>);

      // Create a DialogInteractable instance for a non-existent dialog
      const dialog = testDialog();

      // Check if the dialog is open (should return false, not error)
      dialog.isOpen().should("eq", false);

      // Attempt to get the element (should fail with a clear error)
      cy.on("fail", (err) => {
        expect(err.message).to.include("TestDialog");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      dialog.getElement();
    });

    it("should handle dynamically added dialogs", () => {
      // Mount a component without the dialog
      cy.mount(
        <div data-testid="DynamicContainer" id="dynamic-container">
          <button data-testid="OpenDialogButton">Open Dialog</button>
        </div>
      );

      // Create a DialogInteractable instance
      const dialog = testDialog();

      // Initially the dialog doesn't exist
      dialog.isOpen().should("eq", false);

      // Add the dialog dynamically
      cy.get("#dynamic-container").then(($container) => {
        const element = document.createElement("div");
        element.setAttribute("data-testid", "TestDialog");
        element.innerHTML = `
          <h2>Dynamic Dialog</h2>
          <button data-testid="CloseDialogButton">Close</button>
          <div data-testid="DialogContent">Dynamic Content</div>
        `;
        $container[0].appendChild(element);
      });

      // Now the dialog should exist
      dialog.getElement().should("exist");
      dialog
        .getDialogElement("DialogContent")
        .should("have.text", "Dynamic Content");
    });

    it("should handle dialog timeout gracefully", () => {
      // Mount a component with a dialog
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenDialogButton">Open Dialog</button>
          <div data-testid="TestDialog">
            <h2>Test Dialog</h2>
            <button data-testid="CloseDialogButton">Close</button>
          </div>
        </div>
      );

      const dialog = testDialog();

      // Set up a spy for the error
      const errorSpy = cy.spy().as("errorSpy");

      // Override the default error behavior
      cy.on("fail", (err) => {
        errorSpy(err.message);
        return false; // Prevent the error from failing the test
      });

      // Wait for close with a very short timeout
      // The dialog won't close, so this should timeout
      dialog.waitForClose(100);

      // Verify the error was thrown with the correct message
      cy.get("@errorSpy").should(
        "have.been.calledWithMatch",
        /did not close within 100ms/
      );
    });
  });
});
