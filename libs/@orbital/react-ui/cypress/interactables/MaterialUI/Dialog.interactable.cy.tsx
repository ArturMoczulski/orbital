/// <reference types="cypress" />
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { dialog } from "./Dialog.interactable";

// Test component with a controlled dialog
function TestDialogComponent({
  id = "test-dialog",
  initialOpen = false,
  title = "Test Dialog",
  content = "Dialog Content",
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div data-testid="container">
      <Button data-testid="open-dialog-button" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <div data-testid="dialog-content">{content}</div>
        </DialogContent>
        <DialogActions>
          <Button
            data-testid="close-dialog-button"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// Test component with multiple dialogs
function MultipleDialogsComponent() {
  const [openDialog1, setOpenDialog1] = useState(false);
  const [openDialog2, setOpenDialog2] = useState(false);

  return (
    <div>
      <div data-testid="container1">
        <Button
          data-testid="open-dialog-button"
          onClick={() => setOpenDialog1(true)}
        >
          Open Dialog 1
        </Button>

        <Dialog open={openDialog1} onClose={() => setOpenDialog1(false)}>
          <DialogTitle>Dialog 1</DialogTitle>
          <DialogContent>
            <div data-testid="dialog-content">Content 1</div>
          </DialogContent>
          <DialogActions>
            <Button
              data-testid="close-dialog-button"
              onClick={() => setOpenDialog1(false)}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <div data-testid="container2">
        <Button
          data-testid="open-dialog-button"
          onClick={() => setOpenDialog2(true)}
        >
          Open Dialog 2
        </Button>

        <Dialog open={openDialog2} onClose={() => setOpenDialog2(false)}>
          <DialogTitle>Dialog 2</DialogTitle>
          <DialogContent>
            <div data-testid="dialog-content">Content 2</div>
          </DialogContent>
          <DialogActions>
            <Button
              data-testid="close-dialog-button"
              onClick={() => setOpenDialog2(false)}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

describe("DialogInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a component with a Material UI dialog
      cy.mount(<TestDialogComponent />);
    });

    it("should check if dialog is open", () => {
      const dialogInteractable = dialog();

      // Initially the dialog is closed
      dialogInteractable.isOpened().should("eq", false);

      // Open the dialog by clicking the button
      cy.get('[data-testid="open-dialog-button"]').click();

      // Now the dialog should be open
      dialogInteractable.isOpened().should("eq", true);
    });

    it("should open the dialog", () => {
      const dialogInteractable = dialog();

      // Set up the trigger element
      dialogInteractable["triggerElement"] =
        '[data-testid="open-dialog-button"]';

      // Initially the dialog is closed
      dialogInteractable.isOpened().should("eq", false);

      // Open the dialog using the interactable
      dialogInteractable.open();

      // The dialog should now be open
      dialogInteractable.isOpened().should("eq", true);
    });

    it("should close the dialog", () => {
      // Mount with dialog initially open
      cy.mount(<TestDialogComponent initialOpen={true} />);

      const dialogInteractable = dialog();

      // Verify it's open
      dialogInteractable.isOpened().should("eq", true);

      // Close the dialog using the interactable
      dialogInteractable.close();

      // The dialog should now be closed
      dialogInteractable.isOpened().should("eq", false);
    });

    it("should wait for dialog to close", () => {
      // Mount with dialog initially open
      cy.mount(<TestDialogComponent initialOpen={true} />);

      const dialogInteractable = dialog();

      // Verify it's open
      dialogInteractable.isOpened().should("eq", true);

      // Close the dialog by clicking the close button
      cy.get('[data-testid="close-dialog-button"]').click();

      // Use waitForClose with a short timeout
      dialogInteractable.waitForClose(500);

      // Final verification
      dialogInteractable.isOpened().should("eq", false);
    });

    it("should get elements within the dialog", () => {
      // Mount with dialog initially open
      cy.mount(<TestDialogComponent initialOpen={true} />);

      const dialogInteractable = dialog();

      // Get content using the built-in method
      dialogInteractable.getContent().should("exist");

      // Get title using the built-in method
      dialogInteractable
        .getTitle()
        .should("exist")
        .should("contain.text", "Test Dialog");

      // Get actions using the built-in method
      dialogInteractable.getActions().should("exist");

      // Get an element by data-testid
      dialogInteractable.clickOnElement("dialog-content");

      // Verify content text
      dialogInteractable
        .get({})
        .find('[data-testid="dialog-content"]')
        .should("have.text", "Dialog Content");
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent dialogs gracefully", () => {
      // Mount an empty component
      cy.mount(<div></div>);

      // Create a DialogInteractable instance for a non-existent dialog
      const dialogInteractable = dialog({
        dataTestId: "non-existent-dialog",
      }); // Keep this one for testing non-existent dialogs

      // Check if the dialog is open (should return false, not error)
      dialogInteractable.isOpened().should("eq", false);

      // Attempt to get the element (should fail with a clear error)
      cy.on("fail", (err) => {
        expect(err.message).to.include("non-existent-dialog");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      // Use a short timeout to make the test run faster
      dialogInteractable.get({ timeout: 100 });
    });

    it("should handle dynamically added dialogs", () => {
      // Mount a component without the dialog
      cy.mount(
        <div data-testid="dynamic-container" id="dynamic-container">
          <Button data-testid="open-dialog-button">Open Dialog</Button>
        </div>
      );

      // Create a DialogInteractable instance
      const dialogInteractable = dialog();

      // Initially the dialog doesn't exist
      dialogInteractable.isOpened().should("eq", false);

      // Add the dialog dynamically
      cy.get("#dynamic-container").then(($container) => {
        // Create a dialog element programmatically
        const dialogEl = document.createElement("div");
        dialogEl.className =
          "MuiDialog-root MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm";
        dialogEl.setAttribute("role", "dialog");
        dialogEl.setAttribute("aria-modal", "true");

        // Create dialog content
        const dialogContent = document.createElement("div");
        dialogContent.className = "MuiDialogContent-root";

        // Create content inside dialog
        const contentDiv = document.createElement("div");
        contentDiv.setAttribute("data-testid", "dialog-content");
        contentDiv.textContent = "Dynamic Content";

        // Assemble the dialog
        dialogContent.appendChild(contentDiv);
        dialogEl.appendChild(dialogContent);

        // Add to the container
        $container[0].appendChild(dialogEl);
      });

      // Now the dialog should exist and be open
      dialogInteractable.isOpened().should("eq", true);
      dialogInteractable
        .get({})
        .find('[data-testid="dialog-content"]')
        .should("have.text", "Dynamic Content");
    });
  });
});
