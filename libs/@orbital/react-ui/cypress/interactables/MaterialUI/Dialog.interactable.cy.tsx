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
  describe("Dialog-Specific Functionality", () => {
    beforeEach(() => {
      // Mount a component with a Material UI dialog that's initially open
      cy.mount(<TestDialogComponent initialOpen={true} />);
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

  describe("Multiple Dialogs", () => {
    it("should work with multiple dialogs", () => {
      // Mount the component with multiple dialogs
      cy.mount(<MultipleDialogsComponent />);

      // Open the first dialog
      cy.get(
        '[data-testid="container1"] [data-testid="open-dialog-button"]'
      ).click();

      // Create dialog interactables for each dialog
      const dialog1 = dialog();
      const dialog2 = dialog();

      // Verify first dialog is open
      dialog1.isOpened().should("eq", true);

      // Get content from first dialog
      dialog1
        .getContent()
        .find('[data-testid="dialog-content"]')
        .should("have.text", "Content 1");
      dialog1.getTitle().should("contain.text", "Dialog 1");

      // Close the first dialog
      dialog1.close();

      // Open the second dialog
      cy.get(
        '[data-testid="container2"] [data-testid="open-dialog-button"]'
      ).click();

      // Verify second dialog is open
      dialog2.isOpened().should("eq", true);

      // Get content from second dialog
      dialog2
        .getContent()
        .find('[data-testid="dialog-content"]')
        .should("have.text", "Content 2");
      dialog2.getTitle().should("contain.text", "Dialog 2");
    });
  });
});
