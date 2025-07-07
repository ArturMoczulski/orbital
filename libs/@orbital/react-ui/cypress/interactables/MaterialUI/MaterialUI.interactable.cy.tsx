/// <reference types="cypress" />
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";
import {
  MaterialUIInteractable,
  MaterialUIInteractableOptions,
} from "./MaterialUI.interactable";

/**
 * Test implementation of MaterialUIInteractable for testing purposes
 */
class TestMaterialUIInteractable extends MaterialUIInteractable {
  constructor(options: MaterialUIInteractableOptions) {
    super(options);
  }

  // Add a method to get the text content of this component
  getText(): Cypress.Chainable<string> {
    return this.get().invoke("text");
  }
}

/**
 * Helper function to create a TestMaterialUIInteractable instance
 */
function materialUI(
  options: MaterialUIInteractableOptions
): TestMaterialUIInteractable {
  return new TestMaterialUIInteractable(options);
}

describe("MaterialUIInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a simple component with various Material UI components
      mount(
        <div data-testid="TestContainer">
          <Button data-testid="TestButton" variant="contained">
            Test Button
          </Button>
          <TextField data-testid="TestTextField" label="Test TextField" />
          <FormControl>
            <InputLabel id="test-select-label">Test Select</InputLabel>
            <Select
              labelId="test-select-label"
              data-testid="TestSelect"
              value=""
              label="Test Select"
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
            </Select>
          </FormControl>
        </div>
      );
    });

    it("should find a Material UI component by componentName", () => {
      // Create a MaterialUIInteractable instance with componentName
      const button = materialUI({ componentName: "Button" });

      // Verify the element is found correctly using the .MuiButton-root class
      button.get().should("exist");
      button.get().should("have.class", "MuiButton-root");
      button.getText().should("eq", "Test Button");
    });

    it("should find a Material UI component by dataTestId", () => {
      // Create a MaterialUIInteractable instance with dataTestId
      const textField = materialUI({ dataTestId: "TestTextField" });

      // Verify the element is found correctly
      textField.get().should("exist");
      textField.get().should("have.attr", "data-testid", "TestTextField");
    });

    it("should find a Material UI component by both componentName and dataTestId", () => {
      // Create a MaterialUIInteractable instance with both componentName and dataTestId
      const select = materialUI({
        componentName: "Select",
        dataTestId: "TestSelect",
      });

      // Verify the element is found correctly
      select.get().should("exist");
      select.get().should("have.class", "MuiSelect-root");
      select.get().should("have.attr", "data-testid", "TestSelect");
    });
  });

  describe("Multiple Elements Scenarios", () => {
    beforeEach(() => {
      // Mount a component with multiple instances of the same Material UI component
      mount(
        <div>
          <div data-testid="ButtonContainer">
            <Button data-testid="Button1" className="button-1">
              Button 1
            </Button>
            <Button data-testid="Button2" className="button-2">
              Button 2
            </Button>
            <Button data-testid="Button3" className="button-3">
              Button 3
            </Button>
          </div>

          <div data-testid="TextFieldContainer">
            <TextField
              data-testid="TextField1"
              label="TextField 1"
              className="text-field-1"
            />
            <TextField
              data-testid="TextField2"
              label="TextField 2"
              className="text-field-2"
            />
          </div>
        </div>
      );
    });

    it("should throw an error when multiple elements match and no index is provided", () => {
      // Create a MaterialUIInteractable instance without an index
      const button = materialUI({ componentName: "Button" });

      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("Multiple elements");
        expect(err.message).to.include("no index parameter was provided");
        return false; // Prevent the error from failing the test
      });

      // This should fail because multiple elements match
      button.get();
    });

    it("should select the correct element when index is provided", () => {
      // Create MaterialUIInteractable instances with different indices
      const button0 = materialUI({
        componentName: "Button",
        index: 0,
      });

      const button1 = materialUI({
        componentName: "Button",
        index: 1,
      });

      const button2 = materialUI({
        componentName: "Button",
        index: 2,
      });

      // Verify each component gets the correct element
      button0.getText().should("eq", "Button 1");
      button1.getText().should("eq", "Button 2");
      button2.getText().should("eq", "Button 3");
    });

    it("should throw an error when index is out of bounds", () => {
      // Create a MaterialUIInteractable instance with an out-of-bounds index
      const button = materialUI({
        componentName: "Button",
        index: 10,
      });

      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("Index 10 is out of bounds");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the index is out of bounds
      button.get();
    });
  });

  describe("Scoped Functionality", () => {
    beforeEach(() => {
      // Mount a component with multiple instances of the same Material UI component in different containers
      mount(
        <div>
          <div data-testid="Container1" className="container-1">
            <Button data-testid="TestButton" className="button-1">
              Container 1 Button
            </Button>
            <TextField
              data-testid="TestTextField"
              label="Container 1 TextField"
            />
          </div>

          <div data-testid="Container2" className="container-2">
            <Button data-testid="TestButton" className="button-2">
              Container 2 Button
            </Button>
            <TextField
              data-testid="TestTextField"
              label="Container 2 TextField"
            />
          </div>
        </div>
      );
    });

    it("should scope to a parent element", () => {
      // Create a parent-scoped MaterialUIInteractable for the first container
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const button1 = materialUI({
        componentName: "Button",
        dataTestId: "TestButton",
        parentElement: parent1,
      });

      // Create a parent-scoped MaterialUIInteractable for the second container
      const parent2 = () => cy.get('[data-testid="Container2"]');
      const button2 = materialUI({
        componentName: "Button",
        dataTestId: "TestButton",
        parentElement: parent2,
      });

      // Verify each component finds the correct scoped element
      button1.getText().should("eq", "Container 1 Button");
      button2.getText().should("eq", "Container 2 Button");
    });

    it("should maintain parent scope after interactions", () => {
      // Create a parent-scoped MaterialUIInteractable for the first container
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const button1 = materialUI({
        componentName: "Button",
        dataTestId: "TestButton",
        parentElement: parent1,
      });

      // Perform an interaction
      button1.click();

      // Verify the scope is maintained
      button1.getText().should("eq", "Container 1 Button");
    });
  });

  describe("Complex Selector Scenarios", () => {
    beforeEach(() => {
      // Mount a component with a variety of Material UI components for testing complex selector scenarios
      mount(
        <div data-testid="ComplexContainer">
          {/* Multiple components of the same type with different data-testid */}
          <Button
            data-testid="PrimaryButton"
            variant="contained"
            color="primary"
          >
            Primary Button
          </Button>
          <Button
            data-testid="SecondaryButton"
            variant="contained"
            color="secondary"
          >
            Secondary Button
          </Button>
          <Button data-testid="TextButton" variant="text">
            Text Button
          </Button>

          {/* Same data-testid but different component types */}
          <TextField data-testid="CommonId" label="TextField with common ID" />
          <Select data-testid="CommonId" value="" label="Select with common ID">
            <MenuItem value="option1">Option 1</MenuItem>
          </Select>

          {/* Nested components */}
          <FormControl data-testid="OuterFormControl">
            <InputLabel>Nested Components</InputLabel>
            <Select data-testid="NestedSelect" value="">
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
            </Select>
          </FormControl>

          {/* Multiple identical components */}
          <div data-testid="CheckboxContainer">
            <FormControlLabel
              control={<Checkbox data-testid="TestCheckbox" />}
              label="Checkbox 1"
            />
            <FormControlLabel
              control={<Checkbox data-testid="TestCheckbox" />}
              label="Checkbox 2"
            />
            <FormControlLabel
              control={<Checkbox data-testid="TestCheckbox" />}
              label="Checkbox 3"
            />
          </div>
        </div>
      );
    });

    it("should prioritize componentName + dataTestId over just componentName", () => {
      // Create interactables with different combinations
      const primaryButton = materialUI({
        componentName: "Button",
        dataTestId: "PrimaryButton",
      });

      const secondaryButton = materialUI({
        componentName: "Button",
        dataTestId: "SecondaryButton",
      });

      // Verify each component gets the correct element
      primaryButton.getText().should("eq", "Primary Button");
      secondaryButton.getText().should("eq", "Secondary Button");
    });

    it("should handle elements with the same dataTestId but different componentName", () => {
      // Create interactables for each element type with the same dataTestId
      const textField = materialUI({
        componentName: "TextField",
        dataTestId: "CommonId",
      });

      const select = materialUI({
        componentName: "Select",
        dataTestId: "CommonId",
      });

      // Verify each component gets the correct element
      textField.get().should("have.class", "MuiTextField-root");
      select.get().should("have.class", "MuiSelect-root");
    });

    it("should find nested components correctly", () => {
      // Create an interactable for the nested select
      const nestedSelect = materialUI({
        componentName: "Select",
        dataTestId: "NestedSelect",
      });

      // Create an interactable for the nested select using parent element
      const formControl = () => cy.get('[data-testid="OuterFormControl"]');
      const nestedSelectWithParent = materialUI({
        componentName: "Select",
        dataTestId: "NestedSelect",
        parentElement: formControl,
      });

      // Verify both approaches find the correct element
      nestedSelect.get().should("exist");
      nestedSelect.get().should("have.class", "MuiSelect-root");

      nestedSelectWithParent.get().should("exist");
      nestedSelectWithParent.get().should("have.class", "MuiSelect-root");
    });

    it("should handle multiple identical components with index", () => {
      // Create interactables for each checkbox using index
      const checkbox0 = materialUI({
        componentName: "Checkbox",
        dataTestId: "TestCheckbox",
        index: 0,
      });

      const checkbox1 = materialUI({
        componentName: "Checkbox",
        dataTestId: "TestCheckbox",
        index: 1,
      });

      const checkbox2 = materialUI({
        componentName: "Checkbox",
        dataTestId: "TestCheckbox",
        index: 2,
      });

      // Verify each component gets the correct element
      checkbox0.get().should("exist");
      checkbox1.get().should("exist");
      checkbox2.get().should("exist");

      // Click each checkbox and verify they're independent
      checkbox0.click();
      checkbox0.get().find('input[type="checkbox"]').should("be.checked");
      checkbox1.get().find('input[type="checkbox"]').should("not.be.checked");
      checkbox2.get().find('input[type="checkbox"]').should("not.be.checked");

      checkbox1.click();
      checkbox0.get().find('input[type="checkbox"]').should("be.checked");
      checkbox1.get().find('input[type="checkbox"]').should("be.checked");
      checkbox2.get().find('input[type="checkbox"]').should("not.be.checked");
    });

    it("should combine all selector options (componentName, dataTestId, index, parentElement)", () => {
      // Create a complex container with multiple similar elements
      cy.get('[data-testid="ComplexContainer"]').then(($container) => {
        // Add multiple similar elements to test all selector options together
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 3; i++) {
          const outerDiv = document.createElement("div");
          outerDiv.setAttribute("data-testid", `ComplexOuter${i}`);
          outerDiv.className = "complex-outer";

          for (let j = 0; j < 3; j++) {
            // Create a Material UI Button programmatically
            const button = document.createElement("button");
            button.className = `MuiButton-root MuiButton-contained MuiButton-containedPrimary complex-button-${i}-${j}`;
            button.setAttribute("data-testid", "ComplexButton");
            button.textContent = `Complex Button ${i}-${j}`;
            outerDiv.appendChild(button);
          }

          fragment.appendChild(outerDiv);
        }

        $container[0].appendChild(fragment);
      });

      // Wait for the elements to be added
      cy.get('[data-testid="ComplexOuter0"]').should("exist");

      // Create interactables with all selector options
      const parent0 = () => cy.get('[data-testid="ComplexOuter0"]');
      const button0 = materialUI({
        componentName: "Button",
        dataTestId: "ComplexButton",
        index: 1, // Get the second button
        parentElement: parent0,
      });

      const parent1 = () => cy.get('[data-testid="ComplexOuter1"]');
      const button1 = materialUI({
        componentName: "Button",
        dataTestId: "ComplexButton",
        index: 2, // Get the third button
        parentElement: parent1,
      });

      // Verify each component gets the correct element
      button0.getText().should("eq", "Complex Button 0-1");
      button1.getText().should("eq", "Complex Button 1-2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle dynamically added Material UI components", () => {
      // Mount a component without the test element
      mount(<div data-testid="DynamicContainer" id="dynamic-container"></div>);

      // Create a MaterialUIInteractable instance
      const button = materialUI({
        componentName: "Button",
        dataTestId: "DynamicButton",
      });

      // Add the element dynamically
      cy.get("#dynamic-container").then(($container) => {
        // Create a Material UI Button programmatically
        const buttonEl = document.createElement("button");
        buttonEl.className = "MuiButton-root MuiButton-contained";
        buttonEl.setAttribute("data-testid", "DynamicButton");
        buttonEl.textContent = "Dynamic Button";
        $container[0].appendChild(buttonEl);
      });

      // Now the element should exist
      button.get().should("exist");
      button.getText().should("eq", "Dynamic Button");
    });

    it("should handle non-existent elements gracefully", () => {
      // Mount an empty component
      mount(<div></div>);

      // Create a MaterialUIInteractable instance for a non-existent element
      const button = materialUI({
        componentName: "Button",
        dataTestId: "NonExistentButton",
      });

      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("NonExistentButton");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      // Add a short timeout to make the test run faster
      button.get({ timeout: 100 });
    });

    it("should handle elements that appear and disappear from the DOM", () => {
      // Mount a component with a button that toggles visibility of another element
      mount(
        <div data-testid="ToggleContainer">
          <Button
            data-testid="ToggleButton"
            onClick={() => {
              const element = document.querySelector(
                '[data-testid="ToggleElement"]'
              );
              if (element) {
                element.setAttribute(
                  "style",
                  element.getAttribute("style") === "display: none;"
                    ? ""
                    : "display: none;"
                );
              }
            }}
          >
            Toggle Element
          </Button>

          <TextField
            data-testid="ToggleElement"
            label="Toggle Element"
            style={{ display: "none" }}
          />
        </div>
      );

      // Create an interactable for the toggle element
      const toggleElement = materialUI({
        componentName: "TextField",
        dataTestId: "ToggleElement",
      });

      // Initially the element should exist but be hidden
      toggleElement.get().should("exist");
      toggleElement.get().should("not.be.visible");

      // Click the toggle button to show the element
      cy.get('[data-testid="ToggleButton"]').click();

      // Now the element should be visible
      toggleElement.get().should("be.visible");

      // Click the toggle button again to hide the element
      cy.get('[data-testid="ToggleButton"]').click();

      // The element should exist but be hidden again
      toggleElement.get().should("exist");
      toggleElement.get().should("not.be.visible");
    });
  });

  describe("Dense UI Scenarios", () => {
    describe("Many Buttons in a Row", () => {
      beforeEach(() => {
        // Mount a component with many buttons in a row
        mount(
          <div data-testid="ButtonRowContainer">
            <div className="button-row" style={{ display: "flex", gap: "8px" }}>
              {/* Create 10 buttons in a row */}
              {Array.from({ length: 10 }, (_, i) => (
                <Button
                  key={i}
                  data-testid={`RowButton-${i}`}
                  variant={i % 2 === 0 ? "contained" : "outlined"}
                  color={
                    i % 3 === 0
                      ? "primary"
                      : i % 3 === 1
                        ? "secondary"
                        : "error"
                  }
                  size={i % 2 === 0 ? "small" : "medium"}
                >
                  Button {i + 1}
                </Button>
              ))}
            </div>
          </div>
        );
      });

      it("should target a specific button by index in a dense UI", () => {
        // Target the third button (index 2) in the row
        const thirdButton = materialUI({
          componentName: "Button",
          index: 2,
        });

        // Verify it's the correct button
        thirdButton.getText().should("eq", "Button 3");
        thirdButton.get().should("have.attr", "data-testid", "RowButton-2");
      });

      it("should target a specific button by test ID in a dense UI", () => {
        // Target a specific button by its test ID
        const fifthButton = materialUI({
          dataTestId: "RowButton-4",
        });

        // Verify it's the correct button
        fifthButton.getText().should("eq", "Button 5");
      });

      it("should target buttons with specific attributes in a dense UI", () => {
        // Create a parent element to scope the search
        const buttonRow = () => cy.get(".button-row");

        // Target all primary color buttons (should be buttons 0, 3, 6, 9)
        const primaryButtons = materialUI({
          componentName: "Button",
          parentElement: buttonRow,
        });

        // We expect to get an error because multiple elements match
        cy.on("fail", (err) => {
          expect(err.message).to.include("Multiple elements");
          return false; // Prevent the error from failing the test
        });

        // This should fail because multiple elements match
        primaryButtons.get();
      });

      it("should target a specific button by combining index and attributes", () => {
        // First, let's identify all the buttons that have primary color
        cy.get(".button-row button").then(($allButtons) => {
          // Filter to find buttons with primary color (indices 0, 3, 6, 9)
          const primaryButtons = Array.from($allButtons).filter(
            (button, i) => i % 3 === 0
          );

          // Verify we have at least 2 primary buttons
          expect(primaryButtons.length).to.be.greaterThan(1);

          // Get the data-testid of the second primary button (index 1, which is button at index 3)
          const secondPrimaryButtonTestId =
            primaryButtons[1].getAttribute("data-testid") || "";

          // Ensure we have a valid test ID
          expect(secondPrimaryButtonTestId).to.not.be.empty;

          // Target the button with the specific data-testid
          const secondPrimaryButton = materialUI({
            componentName: "Button",
            dataTestId: secondPrimaryButtonTestId,
          });

          // Verify it's the correct button (should be Button 4)
          secondPrimaryButton.click();
          secondPrimaryButton.getText().should("eq", "Button 4");
          secondPrimaryButton
            .get()
            .should("have.attr", "data-testid", secondPrimaryButtonTestId);
        });
      });
    });

    describe("Card Selection Scenarios", () => {
      beforeEach(() => {
        // Mount a component with multiple cards
        mount(
          <div data-testid="CardContainer">
            {/* Create 5 "cards" using Paper components */}
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 card"
                data-testid={`Card-${i}`}
                style={{
                  padding: "16px",
                  margin: "8px",
                  backgroundColor: i % 2 === 0 ? "#f5f5f5" : "#ffffff",
                }}
              >
                <div className="card-header">
                  <h3>Card {i + 1}</h3>
                </div>
                <div className="card-content">
                  <p>This is card number {i + 1}</p>
                  <Button
                    data-testid={`CardButton-${i}`}
                    variant="contained"
                    color="primary"
                  >
                    Card {i + 1} Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
      });

      it("should target a specific card by index", () => {
        // Target the fourth card (index 3)
        const fourthCard = materialUI({
          componentName: "Paper",
          index: 3,
        });

        // Verify it's the correct card
        fourthCard.get().should("contain.text", "Card 4");
        fourthCard.get().should("have.attr", "data-testid", "Card-3");
      });

      it("should target a button within a specific card", () => {
        // Create a parent element for the fourth card
        const fourthCard = () => cy.get('[data-testid="Card-3"]');

        // Target the button within the fourth card
        const fourthCardButton = materialUI({
          componentName: "Button",
          dataTestId: "CardButton-3",
          parentElement: fourthCard,
        });

        // Verify it's the correct button
        fourthCardButton.getText().should("eq", "Card 4 Action");
      });

      it("should handle targeting elements when there are many similar elements", () => {
        // Target all card buttons
        const allCardButtons = () => cy.get(".card .MuiButton-root");

        // Verify we have 5 card buttons
        allCardButtons().should("have.length", 5);

        // Target a specific card button using the MaterialUIInteractable
        const lastCardButton = materialUI({
          componentName: "Button",
          dataTestId: "CardButton-4", // The last card button
        });

        // Verify it's the correct button
        lastCardButton.getText().should("eq", "Card 5 Action");
      });
    });

    describe("Mixed Component Types", () => {
      beforeEach(() => {
        // Mount a component with a mix of different Material UI components
        mount(
          <div data-testid="MixedComponentsContainer">
            <div className="form-section">
              <h3>Form Section</h3>
              {/* Create 3 text fields */}
              {Array.from({ length: 3 }, (_, i) => (
                <TextField
                  key={`text-${i}`}
                  data-testid={`TextField-${i}`}
                  label={`Field ${i + 1}`}
                  variant="outlined"
                  style={{ margin: "8px" }}
                />
              ))}

              {/* Create 3 selects */}
              {Array.from({ length: 3 }, (_, i) => (
                <FormControl key={`select-${i}`} style={{ margin: "8px" }}>
                  <InputLabel id={`select-label-${i}`}>
                    Select {i + 1}
                  </InputLabel>
                  <Select
                    labelId={`select-label-${i}`}
                    data-testid={`Select-${i}`}
                    value=""
                    label={`Select ${i + 1}`}
                  >
                    <MenuItem value={`option-${i}-1`}>
                      Option {i + 1}.1
                    </MenuItem>
                    <MenuItem value={`option-${i}-2`}>
                      Option {i + 1}.2
                    </MenuItem>
                  </Select>
                </FormControl>
              ))}

              {/* Create 3 checkboxes */}
              {Array.from({ length: 3 }, (_, i) => (
                <FormControlLabel
                  key={`checkbox-${i}`}
                  control={<Checkbox data-testid={`Checkbox-${i}`} />}
                  label={`Checkbox ${i + 1}`}
                  style={{ margin: "8px" }}
                />
              ))}
            </div>
          </div>
        );
      });

      it("should target specific components by type and index in a mixed UI", () => {
        // Target the second text field
        const secondTextField = materialUI({
          componentName: "TextField",
          index: 1,
        });

        // Target the third select
        const thirdSelect = materialUI({
          componentName: "Select",
          index: 2,
        });

        // Target the first checkbox
        const firstCheckbox = materialUI({
          componentName: "Checkbox",
          index: 0,
        });

        // Verify they're the correct components
        secondTextField.get().should("have.attr", "data-testid", "TextField-1");
        thirdSelect.get().should("have.attr", "data-testid", "Select-2");
        firstCheckbox.get().should("have.attr", "data-testid", "Checkbox-0");
      });

      it("should target components by test ID when there are many similar components", () => {
        // Target specific components by their test IDs
        const lastTextField = materialUI({
          dataTestId: "TextField-2",
        });

        const firstSelect = materialUI({
          dataTestId: "Select-0",
        });

        const secondCheckbox = materialUI({
          dataTestId: "Checkbox-1",
        });

        // Verify they're the correct components
        lastTextField.get().should("have.class", "MuiTextField-root");
        firstSelect.get().should("have.class", "MuiSelect-root");
        secondCheckbox.get().should("have.class", "MuiCheckbox-root");
      });

      it("should handle complex targeting with parent elements", () => {
        // Create a parent element for the form section
        const formSection = () => cy.get(".form-section");

        // Target the second text field within the form section
        const secondTextField = materialUI({
          componentName: "TextField",
          index: 1,
          parentElement: formSection,
        });

        // Target the third select within the form section
        const thirdSelect = materialUI({
          componentName: "Select",
          index: 2,
          parentElement: formSection,
        });

        // Verify they're the correct components
        secondTextField.get().should("have.attr", "data-testid", "TextField-1");
        thirdSelect.get().should("have.attr", "data-testid", "Select-2");
      });
    });
  });
});
