/// <reference types="cypress" />
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { mount } from "cypress/react";
import { useState } from "react";
import AutocompleteInteractable from "./Autocomplete.interactable";

// Test options for the autocomplete
const options = [
  "Option 1",
  "Option 2",
  "Option 3",
  "Another option",
  "Last option",
];

// Comprehensive test component with multiple autocomplete instances
const TestAutocompletePageComponent = () => {
  // Single selection autocomplete
  const [singleValue, setSingleValue] = useState<string | null>(null);

  // Multiple selection autocomplete
  const [multipleValue, setMultipleValue] = useState<string[]>([]);

  // Another single selection autocomplete
  const [anotherValue, setAnotherValue] = useState<string | null>(null);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Autocomplete Test Page</Typography>

      {/* Single selection autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Single Selection</Typography>
        <Autocomplete
          data-testid="single-autocomplete"
          options={options}
          value={singleValue}
          onChange={(_, newValue) => setSingleValue(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select an option" />
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>Selected value: {singleValue || "None"}</Typography>
        </Box>
      </Box>

      {/* Multiple selection autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Multiple Selection</Typography>
        <Autocomplete
          data-testid="multiple-autocomplete"
          multiple
          options={options}
          value={multipleValue}
          onChange={(_, newValue) => setMultipleValue(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select multiple options" />
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>
            Selected values:{" "}
            {multipleValue.length ? multipleValue.join(", ") : "None"}
          </Typography>
        </Box>
      </Box>

      {/* Another single selection autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Another Single Selection</Typography>
        <Autocomplete
          data-testid="another-autocomplete"
          options={options}
          value={anotherValue}
          onChange={(_, newValue) => setAnotherValue(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select another option" />
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>
            Another selected value: {anotherValue || "None"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Test interactable class that extends AutocompleteInteractable for testing
class TestAutocompleteInteractable extends AutocompleteInteractable {
  constructor(dataTestId?: string) {
    super({
      dataTestId,
      triggerElement: `[data-testid="${dataTestId}"] input`,
    });
  }
}

describe("AutocompleteInteractable", () => {
  beforeEach(() => {
    // Mount the test page with multiple autocomplete instances for all tests
    mount(<TestAutocompletePageComponent />);
  });

  describe("Basic functionality", () => {
    it("should open and close the autocomplete", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );

      // Initially closed
      autocomplete.isClosed().should("be.true");
      autocomplete.isOpened().should("be.false");

      // Open
      autocomplete.open();
      autocomplete.isOpened().should("be.true");
      autocomplete.isClosed().should("be.false");

      // Close
      autocomplete.close();
      autocomplete.isClosed().should("be.true");
      autocomplete.isOpened().should("be.false");
    });

    it("should list all options", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "another-autocomplete"
      );

      // Check that all options are listed
      autocomplete.items().should("have.length", options.length);

      // Check specific options
      options.forEach((option) => {
        autocomplete.item(option).should("exist");
      });
    });
  });

  describe("Single choice mode", () => {
    it("should select an option", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      const optionToSelect = "Option 2";

      autocomplete.open();
      autocomplete.select(optionToSelect);

      // Check that the option was selected
      cy.contains(`Selected value: ${optionToSelect}`).should("exist");

      autocomplete.selected().should("eq", "Option 2");

      // Autocomplete should be closed after selection
      autocomplete.isClosed().should("be.true");
    });

    it("should select an option in another autocomplete", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "another-autocomplete"
      );
      const optionToSelect = "Another option";

      autocomplete.open();
      autocomplete.select(optionToSelect);

      // Check that the option was selected
      cy.contains(`Another selected value: ${optionToSelect}`).should("exist");

      autocomplete.selected().should("eq", "Another option");

      // Autocomplete should be closed after selection
      autocomplete.isClosed().should("be.true");
    });
  });

  describe("Multiple choice mode", () => {
    it("should select multiple options", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "multiple-autocomplete"
      );
      const optionsToSelect = ["Option 1", "Option 3", "Last option"];

      // Select multiple options
      autocomplete.select(optionsToSelect);

      // Check that the options were selected in the UI
      cy.contains(`Selected values: ${optionsToSelect.join(", ")}`).should(
        "exist"
      );

      // Check that selected() returns the correct array of values
      autocomplete.selected().should("deep.equal", optionsToSelect);
    });
  });

  describe("Multiple autocompletes interaction", () => {
    it("should handle multiple autocompletes independently", () => {
      const singleAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      const multipleAutocomplete = new TestAutocompleteInteractable(
        "multiple-autocomplete"
      );
      const anotherAutocomplete = new TestAutocompleteInteractable(
        "another-autocomplete"
      );

      // Interact with the first autocomplete
      singleAutocomplete.open();
      singleAutocomplete.select("Option 1");
      cy.contains("Selected value: Option 1").should("exist");
      singleAutocomplete.selected().should("eq", "Option 1");

      // Interact with the multiple selection autocomplete
      multipleAutocomplete.select(["Option 2", "Option 3"]);
      cy.contains("Selected values: Option 2, Option 3").should("exist");
      multipleAutocomplete
        .selected()
        .should("deep.equal", ["Option 2", "Option 3"]);

      // Interact with the third autocomplete
      anotherAutocomplete.open();
      anotherAutocomplete.select("Last option");
      cy.contains("Another selected value: Last option").should("exist");
      anotherAutocomplete.selected().should("eq", "Last option");

      // Verify all selections are still correct
      singleAutocomplete.selected().should("eq", "Option 1");
      multipleAutocomplete
        .selected()
        .should("deep.equal", ["Option 2", "Option 3"]);
      anotherAutocomplete.selected().should("eq", "Last option");
    });
  });
});
