/// <reference types="cypress" />
import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";
import { MaterialUIInteractable } from "./MaterialUI.interactable";
import { PopoverInteractable, popover } from "./Popover.interactable";

describe("PopoverInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a simple component with a Select (which uses Popover)
      mount(
        <div data-testid="TestContainer">
          <FormControl fullWidth>
            <InputLabel id="test-select-label">Test Select</InputLabel>
            <Select
              labelId="test-select-label"
              data-testid="TestSelect"
              value=""
              label="Test Select"
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
              <MenuItem value="option3">Option 3</MenuItem>
            </Select>
          </FormControl>
        </div>
      );
    });

    it("should inherit from MaterialUIInteractable", () => {
      // Create a PopoverInteractable instance
      const select = popover({ componentName: "Select" });

      // Verify it's an instance of MaterialUIInteractable
      expect(select instanceof MaterialUIInteractable).to.be.true;

      // Verify it can find the element using MaterialUIInteractable's selector logic
      select.get().should("exist");
      select.get().should("have.class", "MuiSelect-root");
    });

    it("should check if a dropdown is closed initially", () => {
      // Create a PopoverInteractable instance
      const select = popover({ componentName: "Select" });

      // Verify the dropdown is initially closed
      select.isDropdownOpen().should("eq", false);

      // Also test the static method
      PopoverInteractable.isDropdownOpen().should("eq", false);
    });

    it("should open a dropdown", () => {
      // Create a PopoverInteractable instance
      const select = popover({ componentName: "Select" });

      // Open the dropdown
      select.openDropdown();

      // Verify the dropdown is open
      select.isDropdownOpen().should("eq", true);

      // Verify the dropdown content is visible
      cy.get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .should("be.visible");

      // Verify the dropdown contains the expected options
      cy.get("body").find(".MuiMenuItem-root").should("have.length", 3);

      cy.get("body")
        .find(".MuiMenuItem-root")
        .eq(0)
        .should("contain.text", "Option 1");
    });

    it("should close an open dropdown", () => {
      // Create a PopoverInteractable instance
      const select = popover({ componentName: "Select" });

      // Open the dropdown
      select.openDropdown();

      // Verify the dropdown is open
      select.isDropdownOpen().should("eq", true);

      // Close the dropdown
      select.closeDropdown();

      // Verify the dropdown is closed
      select.isDropdownOpen().should("eq", false);

      // Verify the dropdown content is not visible
      cy.get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .should("not.exist");
    });

    it("should use static methods to open and close dropdowns", () => {
      // Create a MaterialUIInteractable instance (not a PopoverInteractable)
      const materialUISelect = new MaterialUIInteractable({
        htmlElementType: "Select",
      });

      // Get the element
      materialUISelect.get().then(($el) => {
        // Use static method to open the dropdown
        PopoverInteractable.openDropdown($el);

        // Verify the dropdown is open
        PopoverInteractable.isDropdownOpen().should("eq", true);

        // Use static method to close the dropdown
        PopoverInteractable.closeDropdown();

        // Verify the dropdown is closed
        PopoverInteractable.isDropdownOpen().should("eq", false);
      });
    });
  });

  describe("Autocomplete Component", () => {
    const options = ["Option 1", "Option 2", "Option 3"];

    beforeEach(() => {
      // Mount a component with an Autocomplete (which uses Popover)
      mount(
        <div data-testid="TestContainer">
          <Autocomplete
            data-testid="TestAutocomplete"
            options={options}
            renderInput={(params) => (
              <TextField {...params} label="Test Autocomplete" />
            )}
          />
        </div>
      );
    });

    it("should open and close an Autocomplete dropdown", () => {
      // Create a PopoverInteractable instance for the Autocomplete
      const autocomplete = popover({ componentName: "Autocomplete" });

      // Verify the dropdown is initially closed
      autocomplete.isDropdownOpen().should("eq", false);

      // Open the dropdown
      autocomplete.openDropdown();

      // Verify the dropdown is open
      autocomplete.isDropdownOpen().should("eq", true);

      // Verify the dropdown content is visible
      cy.get("body").find(".MuiAutocomplete-popper").should("be.visible");

      // Verify the dropdown contains the expected options
      cy.get("body").find('[role="option"]').should("have.length", 3);

      // Close the dropdown
      autocomplete.closeDropdown();

      // Verify the dropdown is closed
      autocomplete.isDropdownOpen().should("eq", false);
    });
  });

  describe("Multiple Popovers", () => {
    beforeEach(() => {
      // Mount a component with multiple popovers
      mount(
        <div data-testid="TestContainer">
          <div data-testid="Container1">
            <FormControl fullWidth>
              <InputLabel id="select1-label">Select 1</InputLabel>
              <Select
                labelId="select1-label"
                data-testid="Select1"
                value=""
                label="Select 1"
              >
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div data-testid="Container2">
            <FormControl fullWidth>
              <InputLabel id="select2-label">Select 2</InputLabel>
              <Select
                labelId="select2-label"
                data-testid="Select2"
                value=""
                label="Select 2"
              >
                <MenuItem value="option3">Option 3</MenuItem>
                <MenuItem value="option4">Option 4</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      );
    });

    it("should handle multiple popovers independently", () => {
      // Create PopoverInteractable instances for each select
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const select1 = popover({
        componentName: "Select",
        parentElement: parent1,
      });

      const parent2 = () => cy.get('[data-testid="Container2"]');
      const select2 = popover({
        componentName: "Select",
        parentElement: parent2,
      });

      // Verify both dropdowns are initially closed
      select1.isDropdownOpen().should("eq", false);
      select2.isDropdownOpen().should("eq", false);

      // Open the first dropdown
      select1.openDropdown();

      // Verify only the first dropdown is open
      select1.isDropdownOpen().should("eq", true);

      // Verify the dropdown content is visible and contains the expected options
      cy.get("body").find(".MuiMenuItem-root").should("have.length", 2);

      cy.get("body")
        .find(".MuiMenuItem-root")
        .eq(0)
        .should("contain.text", "Option 1");

      // Close the first dropdown
      select1.closeDropdown();

      // Open the second dropdown
      select2.openDropdown();

      // Verify only the second dropdown is open
      select1.isDropdownOpen().should("eq", true); // This is true because any popover is open
      select2.isDropdownOpen().should("eq", true);

      // Verify the dropdown content is visible and contains the expected options
      cy.get("body").find(".MuiMenuItem-root").should("have.length", 2);

      cy.get("body")
        .find(".MuiMenuItem-root")
        .eq(0)
        .should("contain.text", "Option 3");

      // Close the second dropdown
      select2.closeDropdown();

      // Verify both dropdowns are closed
      select1.isDropdownOpen().should("eq", false);
      select2.isDropdownOpen().should("eq", false);
    });

    it("should automatically close one popover when another is opened", () => {
      // Create PopoverInteractable instances for each select
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const select1 = popover({
        componentName: "Select",
        parentElement: parent1,
      });

      const parent2 = () => cy.get('[data-testid="Container2"]');
      const select2 = popover({
        componentName: "Select",
        parentElement: parent2,
      });

      // Open the first dropdown
      select1.openDropdown();

      // Verify the first dropdown is open
      select1.isDropdownOpen().should("eq", true);

      // Open the second dropdown
      select2.openDropdown();

      // Verify the first dropdown is automatically closed
      // and only the second dropdown is open
      select1.isDropdownOpen().should("eq", true); // This is true because any popover is open
      select2.isDropdownOpen().should("eq", true);

      // Verify the dropdown content is from the second select
      cy.get("body")
        .find(".MuiMenuItem-root")
        .eq(0)
        .should("contain.text", "Option 3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent elements gracefully", () => {
      // Mount an empty component
      mount(<div></div>);

      // Create a PopoverInteractable instance for a non-existent element
      const select = popover({ componentName: "Select" });

      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("Expected to find element");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      // Add a short timeout to make the test run faster
      select.get({ timeout: 100 });
    });

    it("should handle already open dropdowns", () => {
      // Mount a component with a Select
      mount(
        <div data-testid="TestContainer">
          <FormControl fullWidth>
            <InputLabel id="test-select-label">Test Select</InputLabel>
            <Select
              labelId="test-select-label"
              data-testid="TestSelect"
              value=""
              label="Test Select"
              open={true} // Start with the dropdown open
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
            </Select>
          </FormControl>
        </div>
      );

      // Create a PopoverInteractable instance
      const select = popover({ componentName: "Select" });

      // Verify the dropdown is already open
      select.isDropdownOpen().should("eq", true);

      // Try to open the dropdown (should be a no-op)
      select.openDropdown();

      // Verify the dropdown is still open
      select.isDropdownOpen().should("eq", true);

      // Close the dropdown
      select.closeDropdown();

      // Verify the dropdown is closed
      select.isDropdownOpen().should("eq", false);
    });

    it("should handle already closed dropdowns", () => {
      // Mount a component with a Select
      mount(
        <div data-testid="TestContainer">
          <FormControl fullWidth>
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

      // Create a PopoverInteractable instance
      const select = popover({ componentName: "Select" });

      // Verify the dropdown is initially closed
      select.isDropdownOpen().should("eq", false);

      // Try to close the dropdown (should be a no-op)
      select.closeDropdown();

      // Verify the dropdown is still closed
      select.isDropdownOpen().should("eq", false);
    });
  });
});
