/// <reference types="cypress" />
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
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

// Async options for testing
const asyncOptions = [
  "Async Option 1",
  "Async Option 2",
  "Async Option 3",
  "Another Async Option",
  "Last Async Option",
];

// Comprehensive test component with multiple autocomplete instances
const TestAutocompletePageComponent = () => {
  // Single selection autocomplete
  const [singleValue, setSingleValue] = useState<string | null>(null);

  // Multiple selection autocomplete
  const [multipleValue, setMultipleValue] = useState<string[]>([]);

  // Another single selection autocomplete
  const [anotherValue, setAnotherValue] = useState<string | null>(null);

  // Async autocomplete states
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [asyncLoadedOptions, setAsyncLoadedOptions] = useState<string[]>([]);
  const [asyncValue, setAsyncValue] = useState<string | null>(null);

  // Async multiple selection autocomplete
  const [asyncMultipleLoading, setAsyncMultipleLoading] = useState(false);
  const [asyncMultipleOptions, setAsyncMultipleOptions] = useState<string[]>(
    []
  );
  const [asyncMultipleValue, setAsyncMultipleValue] = useState<string[]>([]);

  // Function to simulate async loading
  const loadAsyncOptions = () => {
    setAsyncLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setAsyncLoadedOptions(asyncOptions);
      setAsyncLoading(false);
    }, 500);
  };

  // Function to simulate async loading for multiple selection
  const loadAsyncMultipleOptions = () => {
    setAsyncMultipleLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setAsyncMultipleOptions(asyncOptions);
      setAsyncMultipleLoading(false);
    }, 500);
  };

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

      {/* Async single selection autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Async Single Selection</Typography>
        <Autocomplete
          data-testid="async-autocomplete"
          options={asyncLoadedOptions}
          loading={asyncLoading}
          onOpen={loadAsyncOptions}
          value={asyncValue}
          onChange={(_, newValue) => setAsyncValue(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Async options"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {asyncLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>Async selected value: {asyncValue || "None"}</Typography>
        </Box>
      </Box>

      {/* Async multiple selection autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Async Multiple Selection</Typography>
        <Autocomplete
          data-testid="async-multiple-autocomplete"
          multiple
          options={asyncMultipleOptions}
          loading={asyncMultipleLoading}
          onOpen={loadAsyncMultipleOptions}
          value={asyncMultipleValue}
          onChange={(_, newValue) => setAsyncMultipleValue(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Async multiple options"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {asyncMultipleLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>
            Async multiple selected values:{" "}
            {asyncMultipleValue.length ? asyncMultipleValue.join(", ") : "None"}
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

    it("should handle opening and closing multiple autocompletes", () => {
      const singleAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      const multipleAutocomplete = new TestAutocompleteInteractable(
        "multiple-autocomplete"
      );
      const anotherAutocomplete = new TestAutocompleteInteractable(
        "another-autocomplete"
      );

      // All autocompletes should be initially closed
      singleAutocomplete.isClosed().should("be.true");
      multipleAutocomplete.isClosed().should("be.true");
      anotherAutocomplete.isClosed().should("be.true");

      // Open the first autocomplete
      singleAutocomplete.open();
      singleAutocomplete.isOpened().should("be.true");
      multipleAutocomplete.isClosed().should("be.true");
      anotherAutocomplete.isClosed().should("be.true");

      // Open the second autocomplete
      multipleAutocomplete.open();
      singleAutocomplete.isOpened().should("be.true");
      multipleAutocomplete.isOpened().should("be.true");
      anotherAutocomplete.isClosed().should("be.true");

      // Close the first autocomplete
      singleAutocomplete.close();
      singleAutocomplete.isClosed().should("be.true");
      multipleAutocomplete.isOpened().should("be.true");
      anotherAutocomplete.isClosed().should("be.true");

      // Open the third autocomplete
      anotherAutocomplete.open();
      singleAutocomplete.isClosed().should("be.true");
      multipleAutocomplete.isOpened().should("be.true");
      anotherAutocomplete.isOpened().should("be.true");

      // Close all autocompletes
      multipleAutocomplete.close();
      anotherAutocomplete.close();
      singleAutocomplete.isClosed().should("be.true");
      multipleAutocomplete.isClosed().should("be.true");
      anotherAutocomplete.isClosed().should("be.true");
    });
  });

  describe("Async loading functionality", () => {
    it("should show loading indicator and load options asynchronously", () => {
      const asyncAutocomplete = new TestAutocompleteInteractable(
        "async-autocomplete"
      );

      // Initially closed with no options
      asyncAutocomplete.isClosed().should("be.true");

      // Open the autocomplete to trigger loading
      asyncAutocomplete.open();

      // Should show loading indicator
      cy.get('[data-testid="async-autocomplete"]')
        .find("circle")
        .should("exist");

      // After loading completes, options should be available
      cy.get('[data-testid="async-autocomplete"]')
        .find("circle")
        .should("not.exist", { timeout: 2000 });

      // Check that options loaded correctly
      asyncAutocomplete.items().should("have.length", asyncOptions.length);
      asyncOptions.forEach((option) => {
        asyncAutocomplete.item(option).should("exist");
      });

      // Select an option
      asyncAutocomplete.select("Async Option 2");
      cy.contains("Async selected value: Async Option 2").should("exist");
      asyncAutocomplete.selected().should("eq", "Async Option 2");
    });

    it("should handle async multiple selection", () => {
      const asyncMultipleAutocomplete = new TestAutocompleteInteractable(
        "async-multiple-autocomplete"
      );

      // Initially closed with no options
      asyncMultipleAutocomplete.isClosed().should("be.true");

      // Open the autocomplete to trigger loading
      asyncMultipleAutocomplete.open();

      // Should show loading indicator
      cy.get('[data-testid="async-multiple-autocomplete"]')
        .find("circle")
        .should("exist");

      // After loading completes, options should be available
      cy.get('[data-testid="async-multiple-autocomplete"]')
        .find("circle")
        .should("not.exist", { timeout: 2000 });

      // Check that options loaded correctly
      asyncMultipleAutocomplete
        .items()
        .should("have.length", asyncOptions.length);

      // Select multiple options
      const optionsToSelect = ["Async Option 1", "Another Async Option"];
      asyncMultipleAutocomplete.select(optionsToSelect);

      // Check that the options were selected
      cy.contains(
        `Async multiple selected values: ${optionsToSelect.join(", ")}`
      ).should("exist");
      asyncMultipleAutocomplete
        .selected()
        .should("deep.equal", optionsToSelect);
    });

    it("should handle all autocompletes with async loading independently", () => {
      const singleAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      const asyncAutocomplete = new TestAutocompleteInteractable(
        "async-autocomplete"
      );
      const asyncMultipleAutocomplete = new TestAutocompleteInteractable(
        "async-multiple-autocomplete"
      );

      // Open and select from regular autocomplete
      singleAutocomplete.select("Option 1");
      cy.contains("Selected value: Option 1").should("exist");

      // Open async autocomplete to trigger loading
      asyncAutocomplete.open();

      // Wait for loading to complete
      cy.get('[data-testid="async-autocomplete"]')
        .find("circle")
        .should("not.exist", { timeout: 2000 });

      // Select from async autocomplete
      asyncAutocomplete.select("Async Option 3");
      cy.contains("Async selected value: Async Option 3").should("exist");

      // Open async multiple autocomplete to trigger loading
      asyncMultipleAutocomplete.open();

      // Wait for loading to complete
      cy.get('[data-testid="async-multiple-autocomplete"]')
        .find("circle")
        .should("not.exist", { timeout: 2000 });

      // Select from async multiple autocomplete
      asyncMultipleAutocomplete.select(["Async Option 1", "Last Async Option"]);
      cy.contains(
        "Async multiple selected values: Async Option 1, Last Async Option"
      ).should("exist");

      // Verify all selections are still correct
      singleAutocomplete.selected().should("eq", "Option 1");
      asyncAutocomplete.selected().should("eq", "Async Option 3");
      asyncMultipleAutocomplete
        .selected()
        .should("deep.equal", ["Async Option 1", "Last Async Option"]);
    });
  });
});
