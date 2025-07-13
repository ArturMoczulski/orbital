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

// Options with IDs for testing ID-based selection
const optionsWithIds = [
  { id: "id1", label: "Option with ID 1" },
  { id: "id2", label: "Option with ID 2" },
  { id: "id3", label: "Option with ID 3" },
  { id: "id4", label: "Another option with ID" },
  { id: "id5", label: "Last option with ID" },
];

// Async options for testing
const asyncOptions = [
  "Async Option 1",
  "Async Option 2",
  "Async Option 3",
  "Another Async Option",
  "Last Async Option",
];

// Generate 50 options for large dataset testing
const largeOptions = Array.from({ length: 50 }, (_, i) => `Option ${i + 1}`);

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

  // Large options autocomplete
  const [largeValue, setLargeValue] = useState<string | null>(null);

  // Options with IDs autocomplete states
  const [singleIdValue, setSingleIdValue] = useState<any>(null);
  const [multipleIdValue, setMultipleIdValue] = useState<any[]>([]);

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

      {/* Error state autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Error State</Typography>
        <Autocomplete
          data-testid="error-autocomplete"
          options={options}
          value={singleValue}
          onChange={(_, newValue) => setSingleValue(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Error state example"
              error={true}
              helperText="This is an error message"
            />
          )}
        />
      </Box>

      {/* Disabled autocomplete */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Disabled State</Typography>
        <Autocomplete
          data-testid="disabled-autocomplete"
          options={options}
          value={singleValue}
          onChange={(_, newValue) => setSingleValue(newValue)}
          disabled={true}
          renderInput={(params) => (
            <TextField {...params} label="Disabled autocomplete" />
          )}
        />
      </Box>

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

      {/* Large options autocomplete for typing test */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Large Options Dataset</Typography>
        <Autocomplete
          data-testid="large-autocomplete"
          options={largeOptions}
          value={largeValue}
          onChange={(_, newValue) => setLargeValue(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Type to filter 50 options" />
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>Large selected value: {largeValue || "None"}</Typography>
        </Box>
      </Box>

      {/* Single selection autocomplete with options that have IDs */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Single Selection with IDs</Typography>
        <Autocomplete
          data-testid="id-single-autocomplete"
          options={optionsWithIds}
          getOptionLabel={(option) => option.label}
          value={singleIdValue}
          onChange={(_, newValue) => setSingleIdValue(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select an option with ID" />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id} data-id={option.id}>
              {option.label}
            </li>
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>
            Selected value with ID:{" "}
            {singleIdValue ? singleIdValue.label : "None"}
          </Typography>
        </Box>
      </Box>

      {/* Multiple selection autocomplete with options that have IDs */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Multiple Selection with IDs</Typography>
        <Autocomplete
          data-testid="id-multiple-autocomplete"
          multiple
          options={optionsWithIds}
          getOptionLabel={(option) => option.label}
          value={multipleIdValue}
          onChange={(_, newValue) => setMultipleIdValue(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select multiple options with IDs" />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id} data-id={option.id}>
              {option.label}
            </li>
          )}
        />
        <Box sx={{ mt: 1 }}>
          <Typography>
            Selected values with IDs:{" "}
            {multipleIdValue.length
              ? multipleIdValue.map((v) => v.label).join(", ")
              : "None"}
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

    it("should detect loading state with isLoading method", () => {
      const asyncAutocomplete = new TestAutocompleteInteractable(
        "async-autocomplete"
      );

      // Initially closed with no loading
      asyncAutocomplete.isLoading().should("be.false");

      // Open the autocomplete to trigger loading
      asyncAutocomplete.open();

      // Should be in loading state
      asyncAutocomplete.isLoading().should("be.true");

      // After loading completes, should no longer be in loading state
      cy.get('[data-testid="async-autocomplete"]')
        .find("circle")
        .should("not.exist", { timeout: 2000 });

      asyncAutocomplete.isLoading().should("be.false");
    });

    it("should detect loading state with isLoading method in multiple selection mode", () => {
      const asyncMultipleAutocomplete = new TestAutocompleteInteractable(
        "async-multiple-autocomplete"
      );

      // Initially closed with no loading
      asyncMultipleAutocomplete.isLoading().should("be.false");

      // Open the autocomplete to trigger loading
      asyncMultipleAutocomplete.open();

      // Should be in loading state
      asyncMultipleAutocomplete.isLoading().should("be.true");

      // After loading completes, should no longer be in loading state
      cy.get('[data-testid="async-multiple-autocomplete"]')
        .find("circle")
        .should("not.exist", { timeout: 2000 });

      asyncMultipleAutocomplete.isLoading().should("be.false");
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

    it("should wait for async options to load before selecting", () => {
      const asyncAutocomplete = new TestAutocompleteInteractable(
        "async-autocomplete"
      );

      // Initially closed with no options
      asyncAutocomplete.isClosed().should("be.true");

      // Call select() directly without manually waiting for loading to complete
      // The select() method should handle waiting for options to load
      asyncAutocomplete.select("Async Option 2");

      // Verify the selection was successful
      cy.contains("Async selected value: Async Option 2").should("exist");
      asyncAutocomplete.selected().should("eq", "Async Option 2");
    });

    it("should wait for async options to load before selecting multiple options", () => {
      const asyncMultipleAutocomplete = new TestAutocompleteInteractable(
        "async-multiple-autocomplete"
      );

      // Initially closed with no options
      asyncMultipleAutocomplete.isClosed().should("be.true");

      // Call select() directly with multiple options without manually waiting
      // The select() method should handle waiting for options to load
      const optionsToSelect = ["Async Option 1", "Another Async Option"];
      asyncMultipleAutocomplete.select(optionsToSelect);

      // Verify the selections were successful
      cy.contains(
        `Async multiple selected values: ${optionsToSelect.join(", ")}`
      ).should("exist");
      asyncMultipleAutocomplete
        .selected()
        .should("deep.equal", optionsToSelect);
    });
  });

  describe("Typing functionality", () => {
    it("should select an option by typing in the textbox", () => {
      const largeAutocomplete = new TestAutocompleteInteractable(
        "large-autocomplete"
      );
      const optionToSelect = "Option 48";

      // Type into the input field to filter options
      largeAutocomplete.type("Option 48");

      // Open should happen automatically after typing
      largeAutocomplete.isOpened().should("be.true");

      // Select the filtered option
      largeAutocomplete.select(optionToSelect);

      // Verify the selection was successful
      cy.contains(`Large selected value: ${optionToSelect}`).should("exist");
      largeAutocomplete.selected().should("eq", optionToSelect);
    });

    it("should filter options as user types", () => {
      const largeAutocomplete = new TestAutocompleteInteractable(
        "large-autocomplete"
      );

      // Type a partial string that will match multiple options
      largeAutocomplete.type("Option 4");

      // Should show filtered options (Option 4, Option 40-49)
      // We expect 11 options: Option 4 and Option 40-49
      largeAutocomplete.items().should("have.length.at.most", 11);

      // All visible options should contain "Option 4"
      largeAutocomplete.items().each(($option) => {
        expect($option.text()).to.include("Option 4");
      });
    });
  });

  describe("Validation functionality", () => {
    it("should detect error state", () => {
      const errorAutocomplete = new TestAutocompleteInteractable(
        "error-autocomplete"
      );

      // Check that hasError returns true for an autocomplete with error state
      errorAutocomplete.hasError().should("be.true");

      // Check that a regular autocomplete doesn't have error state
      const regularAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      regularAutocomplete.hasError().should("be.false");
    });

    it("should get error message", () => {
      const errorAutocomplete = new TestAutocompleteInteractable(
        "error-autocomplete"
      );

      // Check that getError returns the correct error message
      errorAutocomplete.getError().should("eq", "This is an error message");

      // Check that a regular autocomplete returns empty string for error message
      const regularAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      regularAutocomplete.getError().should("eq", "");
    });

    it("should detect disabled state", () => {
      const disabledAutocomplete = new TestAutocompleteInteractable(
        "disabled-autocomplete"
      );

      // Check that isDisabled returns true for a disabled autocomplete
      disabledAutocomplete.isDisabled().should("be.true");

      // Check that a regular autocomplete isn't disabled
      const regularAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      regularAutocomplete.isDisabled().should("be.false");

      // Verify that the disabled autocomplete has the expected attributes
      // The input element should have the disabled attribute
      disabledAutocomplete.textField().should("have.attr", "disabled");

      // Verify that clicking doesn't open the dropdown when disabled
      disabledAutocomplete.getTriggerElement().click({ force: true });
      cy.get('[role="presentation"]').should("not.exist");
    });
  });

  describe("Selection management functionality", () => {
    it("should deselect a specific item in single selection mode", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      const optionToSelect = "Option 2";

      // First select an option
      autocomplete.select(optionToSelect);
      autocomplete.selected().should("eq", optionToSelect);

      // Then deselect it
      autocomplete.deselect(optionToSelect);

      // Verify the selection is cleared
      autocomplete.selected().should("eq", "");
      cy.contains("Selected value: None").should("exist");
    });

    it("should deselect a specific item in multiple selection mode", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "multiple-autocomplete"
      );
      const optionsToSelect = ["Option 1", "Option 3", "Last option"];

      // First select multiple options
      autocomplete.select(optionsToSelect);

      autocomplete.selected().should("deep.equal", optionsToSelect);

      // Then deselect one of them
      autocomplete.deselect("Option 3");

      // Verify the specific option was removed
      const expectedRemaining = ["Option 1", "Last option"];
      autocomplete.selected().should("deep.equal", expectedRemaining);
      cy.contains(`Selected values: ${expectedRemaining.join(", ")}`).should(
        "exist"
      );
    });

    it("should clear all selections in single selection mode", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );
      const optionToSelect = "Option 2";

      // First select an option
      autocomplete.select(optionToSelect);
      autocomplete.selected().should("eq", optionToSelect);

      // Then clear all selections
      autocomplete.clearSelection();

      // Verify the selection is cleared
      autocomplete.selected().should("eq", "");
      cy.contains("Selected value: None").should("exist");
    });

    it("should not attempt to clear when nothing is selected", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );

      // Verify nothing is selected initially
      autocomplete.selected().should("eq", "");

      // Call clearSelection (should not cause errors)
      autocomplete.clearSelection();

      // Verify still nothing is selected
      autocomplete.selected().should("eq", "");
      cy.contains("Selected value: None").should("exist");
    });

    it("should handle clearing all selections in multiple selection mode", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "multiple-autocomplete"
      );
      const optionsToSelect = ["Option 1", "Option 3"];

      // First select multiple options
      autocomplete.select(optionsToSelect);
      autocomplete.selected().should("deep.equal", optionsToSelect);

      // Then clear all selections
      autocomplete.clearSelection();

      // Verify no chips remain
      autocomplete.get().find(".MuiChip-root").should("not.exist");

      // Verify the selection is cleared - should be an empty array or empty string
      // Use a custom assertion to check both conditions
      autocomplete.selected().should((value) => {
        // Check if value is either an empty array or an empty string
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        const isEmptyString = value === "";
        expect(isEmptyArray || isEmptyString).to.be.true;
      });

      // Verify UI shows "None"
      cy.contains("Selected values: None").should("exist");
    });
  });

  describe("Label functionality", () => {
    it("should get the label text from the autocomplete", () => {
      // Test with single selection autocomplete
      const singleAutocomplete = new TestAutocompleteInteractable(
        "single-autocomplete"
      );

      // The label should be "Select an option" based on the test component
      singleAutocomplete.label().should("eq", "Select an option");

      // Test with multiple selection autocomplete
      const multipleAutocomplete = new TestAutocompleteInteractable(
        "multiple-autocomplete"
      );

      // The label should be "Select multiple options" based on the test component
      multipleAutocomplete.label().should("eq", "Select multiple options");

      // Test with error state autocomplete
      const errorAutocomplete = new TestAutocompleteInteractable(
        "error-autocomplete"
      );

      // The label should be "Error state example" based on the test component
      errorAutocomplete.label().should("eq", "Error state example");
    });

    it("should handle autocompletes with no label", () => {
      // Create a test component with no label
      const NoLabelAutocomplete = () => (
        <Autocomplete
          data-testid="no-label-autocomplete"
          options={options}
          renderInput={(params) => (
            <TextField {...params} placeholder="No label autocomplete" />
          )}
        />
      );

      // Mount the component
      mount(<NoLabelAutocomplete />);

      // Create an interactable for the no-label autocomplete
      const noLabelAutocomplete = new TestAutocompleteInteractable(
        "no-label-autocomplete"
      );

      // The label should be empty string since there's no label
      noLabelAutocomplete.label().should("eq", "");
    });
  });

  describe("ID-based selection functionality", () => {
    it("should find an option by ID", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "id-single-autocomplete"
      );

      // Open the autocomplete
      autocomplete.open();

      // Check that itemById can find the option
      autocomplete.itemById("id2").should("exist");
      autocomplete.itemById("id2").should("contain", "Option with ID 2");
    });

    it("should select an option by ID in single selection mode", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "id-single-autocomplete"
      );

      // Select by ID
      autocomplete.selectById("id3");

      // Verify the selection was successful
      cy.contains("Selected value with ID: Option with ID 3").should("exist");

      // Autocomplete should be closed after selection
      autocomplete.isClosed().should("be.true");
    });

    it("should select multiple options by ID in multiple selection mode", () => {
      const autocomplete = new TestAutocompleteInteractable(
        "id-multiple-autocomplete"
      );

      // Select multiple options by ID
      autocomplete.selectById(["id1", "id4", "id5"]);

      // Verify the selections were successful
      cy.contains(
        "Selected values with IDs: Option with ID 1, Another option with ID, Last option with ID"
      ).should("exist");
    });

    it("should handle multiple autocompletes with ID-based selection independently", () => {
      const singleIdAutocomplete = new TestAutocompleteInteractable(
        "id-single-autocomplete"
      );
      const multipleIdAutocomplete = new TestAutocompleteInteractable(
        "id-multiple-autocomplete"
      );

      // Select from single selection autocomplete
      singleIdAutocomplete.selectById("id2");
      cy.contains("Selected value with ID: Option with ID 2").should("exist");

      // Select from multiple selection autocomplete
      multipleIdAutocomplete.selectById(["id3", "id5"]);
      cy.contains(
        "Selected values with IDs: Option with ID 3, Last option with ID"
      ).should("exist");

      // Verify both selections are maintained
      cy.contains("Selected value with ID: Option with ID 2").should("exist");
      cy.contains(
        "Selected values with IDs: Option with ID 3, Last option with ID"
      ).should("exist");
    });
  });
});
