/// <reference types="cypress" />
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";
import React, { useState } from "react";
import { AutocompletePopperInteractable } from "./AutocompletePopper.interactable";

/**
 * Test implementation of AutocompletePopperInteractable for testing purposes
 */
class TestAutocompletePopperInteractable extends AutocompletePopperInteractable {
  constructor(options: any) {
    super(options);
  }

  // Add a method to get the text content of all options
  getOptionsText(): Cypress.Chainable<string[]> {
    return this.items().then(($items) => {
      const texts: string[] = [];
      $items.each((_, el) => {
        texts.push(Cypress.$(el).text());
      });
      return texts;
    });
  }
}

/**
 * Helper function to create a TestAutocompletePopperInteractable instance
 */
function autocompletePopper(options: any): TestAutocompletePopperInteractable {
  return new TestAutocompletePopperInteractable(options);
}

// Sample options for the Autocomplete component
const options = [
  { label: "Option 1", id: 1 },
  { label: "Option 2", id: 2 },
  { label: "Option 3", id: 3 },
  { label: "Option 4", id: 4 },
  { label: "Option 5", id: 5 },
];

describe("AutocompletePopperInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a simple component with an Autocomplete that opens a popper
      mount(<AutocompleteTestComponent />);
    });

    it("should open and close the autocomplete popper", () => {
      // Create an AutocompletePopperInteractable instance
      const popperComponent = autocompletePopper({
        componentName: "AutocompletePopper",
        triggerElement: '[data-testid="AutocompleteTrigger"]',
      });

      // Initially the popper should be closed
      popperComponent.isClosed().should("eq", true);

      // Open the popper
      popperComponent.open();

      // Verify the popper is open
      popperComponent.isOpened().should("eq", true);

      // Close the popper
      popperComponent.close();

      // Wait a moment for the popper to close
      cy.wait(500);

      // Verify the popper is closed
      popperComponent.isClosed().should("eq", true);
    });

    it("should list all available options", () => {
      // Create an AutocompletePopperInteractable instance
      const popperComponent = autocompletePopper({
        componentName: "AutocompletePopper",
        triggerElement: '[data-testid="AutocompleteTrigger"]',
      });

      // Open the popper
      popperComponent.open();

      // Get all items and verify their count
      popperComponent.items().should("have.length", options.length);

      // Verify the text content of the options
      popperComponent.getOptionsText().should(
        "deep.equal",
        options.map((opt) => opt.label)
      );
    });

    it("should find a specific option by text", () => {
      // Create an AutocompletePopperInteractable instance
      const popperComponent = autocompletePopper({
        componentName: "AutocompletePopper",
        triggerElement: '[data-testid="AutocompleteTrigger"]',
      });

      // Open the popper
      popperComponent.open();

      // Find a specific option
      popperComponent.item("Option 3").should("exist");
      popperComponent.item("Option 3").should("contain.text", "Option 3");
    });

    it("should select an option from the list", () => {
      // Create an AutocompletePopperInteractable instance
      const popperComponent = autocompletePopper({
        componentName: "AutocompletePopper",
        triggerElement: '[data-testid="AutocompleteTrigger"]',
      });

      // Open the popper
      popperComponent.open();

      // Select an option
      popperComponent.select("Option 4");

      // Verify the popper is closed after selection
      popperComponent.isClosed().should("eq", true);

      // Verify the selected value is displayed in the input
      cy.get('[data-testid="AutocompleteTrigger"]').should(
        "have.value",
        "Option 4"
      );
    });

    it("should trigger the popper using the trigger method", () => {
      // Create an AutocompletePopperInteractable instance
      const popperComponent = autocompletePopper({
        componentName: "AutocompletePopper",
        triggerElement: '[data-testid="AutocompleteTrigger"]',
      });

      // Trigger the popper
      popperComponent.trigger();

      // Verify the popper is open
      popperComponent.isTriggered().should("eq", true);

      // Verify isOpened is a shortcut to isTriggered
      popperComponent.isOpened().should("eq", true);

      // Close the popper
      popperComponent.close();

      // Wait a moment for the popper to close
      cy.wait(500);

      // Verify the popper is not triggered
      popperComponent.isTriggered().should("eq", false);
    });
  });

  describe("Multiple Autocompletes", () => {
    beforeEach(() => {
      // Mount a component with multiple autocompletes
      mount(<MultipleAutocompleteTestComponent />);
    });

    it("should handle multiple autocomplete poppers independently", () => {
      // Create AutocompletePopperInteractable instances for both autocompletes
      const popper1 = autocompletePopper({
        dataTestId: "AutocompletePopper1",
        triggerElement: '[data-testid="AutocompleteTrigger1"]',
      });

      const popper2 = autocompletePopper({
        dataTestId: "AutocompletePopper2",
        triggerElement: '[data-testid="AutocompleteTrigger2"]',
      });

      // Initially both poppers should be closed
      popper1.isTriggered().should("eq", false);
      popper2.isTriggered().should("eq", false);

      // Open the first popper
      popper1.trigger();

      // Verify the first popper is open
      popper1.isTriggered().should("eq", true);

      // The second popper should still be closed
      popper2.isTriggered().should("eq", false);

      // Select an option from the first popper
      popper1.select("Option 2");

      // Verify the first popper is closed and the value is selected
      popper1.isClosed().should("eq", true);
      cy.get('[data-testid="AutocompleteTrigger1"]').should(
        "have.value",
        "Option 2"
      );

      // Open the second popper
      popper2.trigger();

      // Verify the second popper is open
      popper2.isTriggered().should("eq", true);

      // The first popper should still be closed
      popper1.isTriggered().should("eq", false);

      // Select an option from the second popper
      popper2.select("Option 5");

      // Verify the second popper is closed and the value is selected
      popper2.isClosed().should("eq", true);
      cy.get('[data-testid="AutocompleteTrigger2"]').should(
        "have.value",
        "Option 5"
      );
    });
  });
});

// Component for basic autocomplete tests
const AutocompleteTestComponent: React.FC = () => {
  const [value, setValue] = useState<any>(null);

  return (
    <div data-testid="AutocompleteContainer">
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            inputProps={{
              ...params.inputProps,
              "data-testid": "AutocompleteTrigger",
            }}
            label="Select an option"
          />
        )}
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue);
        }}
        data-testid="TestAutocomplete"
      />
    </div>
  );
};

// Component for multiple autocomplete tests
const MultipleAutocompleteTestComponent: React.FC = () => {
  const [value1, setValue1] = useState<any>(null);
  const [value2, setValue2] = useState<any>(null);

  return (
    <div data-testid="MultipleAutocompleteContainer">
      <div style={{ marginBottom: "20px" }}>
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              inputProps={{
                ...params.inputProps,
                "data-testid": "AutocompleteTrigger1",
              }}
              label="First Autocomplete"
            />
          )}
          value={value1}
          onChange={(_, newValue) => {
            setValue1(newValue);
          }}
          data-testid="TestAutocomplete1"
        />
      </div>
      <div>
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              inputProps={{
                ...params.inputProps,
                "data-testid": "AutocompleteTrigger2",
              }}
              label="Second Autocomplete"
            />
          )}
          value={value2}
          onChange={(_, newValue) => {
            setValue2(newValue);
          }}
          data-testid="TestAutocomplete2"
        />
      </div>
    </div>
  );
};
