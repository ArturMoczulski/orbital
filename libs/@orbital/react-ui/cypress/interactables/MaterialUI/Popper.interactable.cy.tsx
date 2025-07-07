/// <reference types="cypress" />
import Button from "@mui/material/Button";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import { mount } from "cypress/react";
import React, { useState } from "react";
import { PopperInteractable } from "./Popper.interactable";

/**
 * Test implementation of PopperInteractable for testing purposes
 */
class TestPopperInteractable extends PopperInteractable {
  constructor(options: any) {
    super(options);
  }

  // Add a method to get the text content of the popper
  getPopperText(): Cypress.Chainable<string> {
    return this.getContent().invoke("text");
  }
}

/**
 * Helper function to create a TestPopperInteractable instance
 */
function popper(options: any): TestPopperInteractable {
  return new TestPopperInteractable(options);
}

describe("PopperInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a simple component with a button that opens a popper
      mount(<PopperTestComponent />);
    });

    it("should open and close the popper", () => {
      // Create a PopperInteractable instance using componentName
      const popperComponent = popper({
        componentName: "Popper",
        triggerElement: '[data-testid="PopperTrigger"]',
      });

      // Open the popper
      popperComponent.open();

      // Verify the popper is open
      popperComponent.isOpened().should("eq", true);

      // Check the content
      popperComponent
        .getPopperText()
        .should("contain", "This is the popper content");

      // Close the popper
      popperComponent.close();

      // Verify the popper is closed using the interactable's isClosed method
      popperComponent.isClosed().should("eq", true);
    });

    it("should trigger the popper using the trigger method", () => {
      // Create a PopperInteractable instance using componentName
      const popperComponent = popper({
        componentName: "Popper",
        triggerElement: '[data-testid="PopperTrigger"]',
      });

      // Trigger the popper
      popperComponent.trigger();

      // Verify the popper is open
      popperComponent.isOpened().should("eq", true);

      // Check the content
      popperComponent
        .getPopperText()
        .should("contain", "This is the popper content");

      // Close the popper
      popperComponent.close();

      // Wait a moment for the popper to close
      cy.wait(100);

      // Verify the popper is closed
      popperComponent.isClosed().should("eq", true);
    });

    it("should click on elements within the popper", () => {
      // Create a PopperInteractable instance using componentName
      const popperComponent = popper({
        componentName: "Popper",
        triggerElement: '[data-testid="PopperTrigger"]',
      });

      // Open the popper
      popperComponent.open();

      // Verify we can interact with elements inside the popper
      popperComponent
        .getContent()
        .find('[data-testid="PopperContent"]')
        .should("exist");
      popperComponent
        .getContent()
        .find('[data-testid="PopperContent"]')
        .should("contain.text", "This is the popper content");
    });

    it("should check if the popper is triggered", () => {
      // Create a PopperInteractable instance using componentName
      const popperComponent = popper({
        componentName: "Popper",
        triggerElement: '[data-testid="PopperTrigger"]',
      });

      // Initially the popper should not be triggered
      popperComponent.isTriggered().should("eq", false);

      // Trigger the popper
      popperComponent.trigger();

      // Verify the popper is triggered
      popperComponent.isTriggered().should("eq", true);

      // Verify isOpened is a shortcut to isTriggered
      popperComponent.isOpened().should("eq", true);

      // Close the popper
      popperComponent.close();

      // Wait a moment for the popper to close
      cy.wait(100);

      // Verify the popper is not triggered
      popperComponent.isTriggered().should("eq", false);
    });
  });

  describe("Multiple Poppers", () => {
    beforeEach(() => {
      // Mount a component with multiple popper buttons
      mount(<MultiplePopperTestComponent />);
    });

    it("should handle different poppers for different buttons", () => {
      // Create PopperInteractable instances for both poppers
      const popper1 = popper({
        dataTestId: "TestPopper1",
        triggerElement: '[data-testid="PopperTrigger1"]',
      });

      const popper2 = popper({
        dataTestId: "TestPopper2",
        triggerElement: '[data-testid="PopperTrigger2"]',
      });

      popper1.isClosed().should("be.true");
      popper2.isClosed().should("be.true");

      // Open first popper
      popper1.open();

      // Verify content
      popper1.isOpened().should("be.true");
      popper1.getContent().should("be.visible");
      popper1.getContent().should("contain", "This is popper 1 content");

      // Close by clicking away
      cy.get("body").click(10, 10);
      cy.wait(100);

      // Verify closed
      popper1.isClosed().should("be.true");
      popper2.isClosed().should("be.true");

      // Open second popper
      popper2.open();

      // Verify content
      popper2.isOpened().should("be.true");
      popper2.getContent().should("be.visible");
      popper2.getContent().should("contain", "This is popper 2 content");

      // Close by clicking away
      cy.get("body").click(10, 10);
      cy.wait(200);
    });
  });
});

// Component for basic popper tests
const PopperTestComponent: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  return (
    <div data-testid="PopperContainer">
      <Button
        data-testid="PopperTrigger"
        aria-describedby={id}
        variant="contained"
        onClick={handleClick}
      >
        Toggle Popper
      </Button>
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        data-testid="TestPopper"
      >
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            backgroundColor: "white",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <Typography data-testid="PopperContent">
            This is the popper content.
          </Typography>
        </div>
      </Popper>
    </div>
  );
};

// Component for multiple popper tests
const MultiplePopperTestComponent: React.FC = () => {
  const [anchorEl1, setAnchorEl1] = useState<HTMLButtonElement | null>(null);
  const [anchorEl2, setAnchorEl2] = useState<HTMLButtonElement | null>(null);

  const handleClick1 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl1(anchorEl1 ? null : event.currentTarget);
  };

  const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl2(anchorEl2 ? null : event.currentTarget);
  };

  const open1 = Boolean(anchorEl1);
  const open2 = Boolean(anchorEl2);
  const id1 = open1 ? "popper-1" : undefined;
  const id2 = open2 ? "popper-2" : undefined;

  return (
    <div data-testid="MultiplePopperContainer">
      <div style={{ display: "flex", gap: "16px" }}>
        <Button
          data-testid="PopperTrigger1"
          aria-describedby={id1}
          variant="contained"
          onClick={handleClick1}
        >
          Toggle Popper 1
        </Button>
        <Button
          data-testid="PopperTrigger2"
          aria-describedby={id2}
          variant="contained"
          onClick={handleClick2}
        >
          Toggle Popper 2
        </Button>
      </div>

      <Popper
        id={id1}
        open={open1}
        anchorEl={anchorEl1}
        placement="bottom-start"
        data-testid="TestPopper1"
      >
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            backgroundColor: "white",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            marginTop: "8px",
          }}
        >
          <Typography data-testid="PopperContent1">
            This is popper 1 content.
          </Typography>
        </div>
      </Popper>

      <Popper
        id={id2}
        open={open2}
        anchorEl={anchorEl2}
        placement="bottom-start"
        data-testid="TestPopper2"
      >
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            backgroundColor: "white",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            marginTop: "8px",
          }}
        >
          <Typography data-testid="PopperContent2">
            This is popper 2 content.
          </Typography>
        </div>
      </Popper>
    </div>
  );
};
