/// <reference types="cypress" />
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { mount } from "cypress/react";
import React, { useState } from "react";
import { PopoverInteractable } from "./Popover.interactable";

/**
 * Test implementation of PopoverInteractable for testing purposes
 */
class TestPopoverInteractable extends PopoverInteractable {
  constructor(options: any) {
    super(options);
  }

  // Add a method to get the text content of the popover
  getPopoverText(): Cypress.Chainable<string> {
    return this.getContent().invoke("text");
  }
}

/**
 * Helper function to create a TestPopoverInteractable instance
 */
function popover(options: any): TestPopoverInteractable {
  return new TestPopoverInteractable(options);
}

describe("PopoverInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a simple component with a button that opens a popover
      mount(<PopoverTestComponent />);
    });

    it("should open and close the popover", () => {
      // Create a PopoverInteractable instance using componentName
      const popoverComponent = popover({
        componentName: "Popover",
        triggerElement: '[data-testid="PopoverTrigger"]',
      });

      // Open the popover
      popoverComponent.open();

      // Verify the popover is open
      popoverComponent.isOpened().should("eq", true);

      // Check the content
      popoverComponent
        .getPopoverText()
        .should("contain", "This is the popover content");

      // Close the popover
      popoverComponent.close();

      // Wait a moment for the popover to close
      cy.wait(500);

      // Verify the popover is closed using the interactable's isClosed method
      popoverComponent.isClosed().should("eq", true);
    });

    it("should click on elements within the popover", () => {
      // Create a PopoverInteractable instance using componentName
      const popoverComponent = popover({
        componentName: "Popover",
        triggerElement: '[data-testid="PopoverTrigger"]',
      });

      // Open the popover
      popoverComponent.open();

      // Verify we can interact with elements inside the popover
      popoverComponent
        .getContent()
        .find('[data-testid="PopoverContent"]')
        .should("exist");
      popoverComponent
        .getContent()
        .find('[data-testid="PopoverContent"]')
        .should("contain.text", "This is the popover content");
    });
  });

  describe("Complex Scenarios", () => {
    beforeEach(() => {
      // Mount a component with multiple popovers
      mount(<MultiplePopoversTestComponent />);
    });

    // Note: Material UI doesn't support having multiple popovers open simultaneously
    // Opening a new popover automatically closes any previously open ones

    it("should handle multiple popovers sequentially", () => {
      // Create PopoverInteractable instances for both popovers
      const popover1 = popover({
        dataTestId: "TestPopover1",
        triggerElement: '[data-testid="PopoverTrigger1"]',
      });

      const popover2 = popover({
        dataTestId: "TestPopover2",
        triggerElement: '[data-testid="PopoverTrigger2"]',
      });

      // Open the first popover
      popover1.open();

      // Verify the first popover is open
      popover1.isOpened().should("eq", true);

      // Check the content of the first popover
      popover1.getPopoverText().should("contain", "This is popover 1 content");

      // Close the first popover
      popover1.close();
      cy.wait(500);

      // Verify the first popover is closed
      popover1.isClosed().should("eq", true);

      // Open the second popover
      popover2.open();

      // Verify the second popover is open
      popover2.isOpened().should("eq", true);

      // Check the content of the second popover
      popover2.getPopoverText().should("contain", "This is popover 2 content");

      // Close the second popover
      popover2.close();
      cy.wait(500);

      // Verify the second popover is closed
      popover2.isClosed().should("eq", true);
    });
  });
});

// Component for basic popover tests
const PopoverTestComponent: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <div data-testid="PopoverContainer">
      <Button
        data-testid="PopoverTrigger"
        aria-describedby={id}
        variant="contained"
        onClick={handleClick}
      >
        Open Popover
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        data-testid="TestPopover"
      >
        <Typography sx={{ p: 2 }} data-testid="PopoverContent">
          This is the popover content.
        </Typography>
      </Popover>
    </div>
  );
};

// Component for multiple popovers tests
const MultiplePopoversTestComponent: React.FC = () => {
  const [anchorEl1, setAnchorEl1] = useState<HTMLButtonElement | null>(null);
  const [anchorEl2, setAnchorEl2] = useState<HTMLButtonElement | null>(null);

  const handleClick1 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl1(event.currentTarget);
  };

  const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose1 = () => {
    setAnchorEl1(null);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const open1 = Boolean(anchorEl1);
  const open2 = Boolean(anchorEl2);
  const id1 = open1 ? "popover-1" : undefined;
  const id2 = open2 ? "popover-2" : undefined;

  return (
    <div data-testid="MultiplePopoversContainer">
      <div style={{ display: "flex", gap: "16px" }}>
        <Button
          data-testid="PopoverTrigger1"
          aria-describedby={id1}
          variant="contained"
          onClick={handleClick1}
        >
          Open Popover 1
        </Button>
        <Button
          data-testid="PopoverTrigger2"
          aria-describedby={id2}
          variant="contained"
          onClick={handleClick2}
        >
          Open Popover 2
        </Button>
      </div>

      <Popover
        id={id1}
        open={open1}
        anchorEl={anchorEl1}
        onClose={handleClose1}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        data-testid="TestPopover1"
      >
        <Typography sx={{ p: 2 }} data-testid="PopoverContent1">
          This is popover 1 content.
        </Typography>
      </Popover>

      <Popover
        id={id2}
        open={open2}
        anchorEl={anchorEl2}
        onClose={handleClose2}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        data-testid="TestPopover2"
      >
        <Typography sx={{ p: 2 }} data-testid="PopoverContent2">
          This is popover 2 content.
        </Typography>
      </Popover>
    </div>
  );
};
