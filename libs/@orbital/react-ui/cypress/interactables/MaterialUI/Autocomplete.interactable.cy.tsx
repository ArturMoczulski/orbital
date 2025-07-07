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

// Simple test component with a single autocomplete
const TestAutocompleteComponent = () => {
  const [value, setValue] = useState<string | null>(null);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Test Autocomplete</Typography>
      <Autocomplete
        data-testid="test-autocomplete"
        options={options}
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Select an option" />
        )}
      />
      <Box sx={{ mt: 2 }}>
        <Typography>Selected value: {value || "None"}</Typography>
      </Box>
    </Box>
  );
};

// Component with multiple autocompletes
const TestMultipleAutocompletesComponent = () => {
  const [value1, setValue1] = useState<string | null>(null);
  const [value2, setValue2] = useState<string | null>(null);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Multiple Autocompletes</Typography>

      <Box sx={{ mb: 2 }}>
        <Autocomplete
          data-testid="autocomplete-1"
          options={options}
          value={value1}
          onChange={(_, newValue) => setValue1(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="First autocomplete" />
          )}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Autocomplete
          data-testid="autocomplete-2"
          options={options}
          value={value2}
          onChange={(_, newValue) => setValue2(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Second autocomplete" />
          )}
        />
      </Box>

      <Box>
        <Typography>First value: {value1 || "None"}</Typography>
        <Typography>Second value: {value2 || "None"}</Typography>
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
  describe("Basic functionality", () => {
    beforeEach(() => {
      mount(<TestAutocompleteComponent />);
    });

    it("should open and close the autocomplete", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "test-autocomplete"
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
        "test-autocomplete"
      );

      // Check that all options are listed
      autocomplete.items().should("have.length", options.length);

      // Check specific options
      options.forEach((option) => {
        autocomplete.item(option).should("exist");
      });
    });

    it("should select an option", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "test-autocomplete"
      );
      const optionToSelect = "Option 2";

      autocomplete.open();
      autocomplete.select(optionToSelect);

      // Check that the option was selected
      cy.contains(`Selected value: ${optionToSelect}`).should("exist");

      // Autocomplete should be closed after selection
      autocomplete.isClosed().should("be.true");
    });
  });

  describe("Multiple autocompletes", () => {
    beforeEach(() => {
      mount(<TestMultipleAutocompletesComponent />);
    });

    it("should handle multiple autocompletes independently", () => {
      const autocomplete1 = new TestAutocompleteInteractable("autocomplete-1");
      const autocomplete2 = new TestAutocompleteInteractable("autocomplete-2");

      // Open first autocomplete
      autocomplete1.open();
      autocomplete1.isOpened().should("be.true");

      // Select from first autocomplete
      autocomplete1.select("Option 1");
      cy.contains("First value: Option 1").should("exist");

      autocomplete1.close();

      // Open second autocomplete
      autocomplete2.open();
      autocomplete2.isOpened().should("be.true");

      // Select from second autocomplete
      autocomplete2.select("Option 3");
      cy.contains("Second value: Option 3").should("exist");
    });
  });
});
