/// <reference types="cypress" />
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { modal } from "./Modal.interactable";

// Test component with a controlled modal
function TestModalComponent({
  id = "test-modal",
  initialOpen = false,
  title = "Test Modal",
  content = "Modal Content",
}) {
  const [open, setOpen] = useState(initialOpen);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  return (
    <div data-testid="container">
      <Button data-testid="open-modal-button" onClick={() => setOpen(true)}>
        Open Modal
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <div data-testid="modal-content">{content}</div>
          </Typography>
          <Button
            data-testid="close-modal-button"
            onClick={() => setOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

// Test component with multiple modals
function MultipleModalsComponent() {
  const [openModal1, setOpenModal1] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  return (
    <div>
      <div data-testid="container1">
        <Button
          data-testid="open-modal-button"
          onClick={() => setOpenModal1(true)}
        >
          Open Modal 1
        </Button>

        <Modal open={openModal1} onClose={() => setOpenModal1(false)}>
          <Box sx={style}>
            <Typography variant="h6" component="h2">
              Modal 1
            </Typography>
            <Typography sx={{ mt: 2 }}>
              <div data-testid="modal-content">Content 1</div>
            </Typography>
            <Button
              data-testid="close-modal-button"
              onClick={() => setOpenModal1(false)}
              sx={{ mt: 2 }}
            >
              Close
            </Button>
          </Box>
        </Modal>
      </div>

      <div data-testid="container2">
        <Button
          data-testid="open-modal-button"
          onClick={() => setOpenModal2(true)}
        >
          Open Modal 2
        </Button>

        <Modal open={openModal2} onClose={() => setOpenModal2(false)}>
          <Box sx={style}>
            <Typography variant="h6" component="h2">
              Modal 2
            </Typography>
            <Typography sx={{ mt: 2 }}>
              <div data-testid="modal-content">Content 2</div>
            </Typography>
            <Button
              data-testid="close-modal-button"
              onClick={() => setOpenModal2(false)}
              sx={{ mt: 2 }}
            >
              Close
            </Button>
          </Box>
        </Modal>
      </div>
    </div>
  );
}

describe("ModalInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a component with a Material UI modal
      cy.mount(<TestModalComponent />);
    });

    it("should check if modal is open", () => {
      const modalInteractable = modal();

      // Initially the modal is closed
      modalInteractable.isOpened().should("eq", false);

      // Open the modal by clicking the button
      cy.get('[data-testid="open-modal-button"]').click();

      // Now the modal should be open
      modalInteractable.isOpened().should("eq", true);
    });

    it("should open the modal", () => {
      const modalInteractable = modal();

      // Set up the trigger element
      modalInteractable["triggerElement"] = '[data-testid="open-modal-button"]';

      // Initially the modal is closed
      modalInteractable.isOpened().should("eq", false);

      // Open the modal using the interactable
      modalInteractable.open();

      // The modal should now be open
      modalInteractable.isOpened().should("eq", true);
    });

    it("should close the modal", () => {
      // Mount with modal initially open
      cy.mount(<TestModalComponent initialOpen={true} />);

      const modalInteractable = modal();

      // Verify it's open
      modalInteractable.isOpened().should("eq", true);

      // Close the modal using the interactable
      modalInteractable.close();

      // The modal should now be closed
      modalInteractable.isOpened().should("eq", false);
    });

    it("should wait for modal to close", () => {
      // Mount with modal initially open
      cy.mount(<TestModalComponent initialOpen={true} />);

      const modalInteractable = modal();

      // Verify it's open
      modalInteractable.isOpened().should("eq", true);

      // Close the modal by clicking the close button
      cy.get('[data-testid="close-modal-button"]').click();

      // Use waitForClose with a short timeout
      modalInteractable.waitForClose(500);

      // Final verification
      modalInteractable.isOpened().should("eq", false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent modals gracefully", () => {
      // Mount an empty component
      cy.mount(<div></div>);

      // Create a ModalInteractable instance for a non-existent modal
      const modalInteractable = modal({
        dataTestId: "non-existent-modal",
      });

      // Check if the modal is open (should return false, not error)
      modalInteractable.isOpened().should("eq", false);

      // Attempt to get the element (should fail with a clear error)
      cy.on("fail", (err) => {
        expect(err.message).to.include("non-existent-modal");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      // Use a short timeout to make the test run faster
      modalInteractable.get({ timeout: 100 });
    });

    it("should handle dynamically added modals", () => {
      // Mount a component without the modal
      cy.mount(
        <div data-testid="dynamic-container" id="dynamic-container">
          <Button data-testid="open-modal-button">Open Modal</Button>
        </div>
      );

      // Create a ModalInteractable instance
      const modalInteractable = modal();

      // Initially the modal doesn't exist
      modalInteractable.isOpened().should("eq", false);

      // Add the modal dynamically
      cy.get("#dynamic-container").then(($container) => {
        // Create a modal element programmatically
        const modalEl = document.createElement("div");
        modalEl.className = "MuiModal-root";
        modalEl.setAttribute("role", "presentation");
        modalEl.setAttribute("aria-modal", "true");

        // Create modal content
        const modalContent = document.createElement("div");
        modalContent.className = "MuiBox-root";

        // Create content inside modal
        const contentDiv = document.createElement("div");
        contentDiv.setAttribute("data-testid", "modal-content");
        contentDiv.textContent = "Dynamic Content";

        // Assemble the modal
        modalContent.appendChild(contentDiv);
        modalEl.appendChild(modalContent);

        // Add to the container
        $container[0].appendChild(modalEl);
      });

      // Now the modal should exist and be open
      modalInteractable.isOpened().should("eq", true);
      modalInteractable
        .get({})
        .find('[data-testid="modal-content"]')
        .should("have.text", "Dynamic Content");
    });
  });
});
