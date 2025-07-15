import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";
import { autocomplete } from "./Autocomplete.interactable";

describe("AutocompleteInteractable", () => {
  it("should select options by ID even when the ID is not directly in the DOM", () => {
    // Define options with IDs that don't appear directly in the rendered HTML
    const options = [
      { id: "option-1", label: "Option One" },
      { id: "option-2", label: "Option Two" },
      { id: "option-3", label: "Option Three" },
    ];

    // Mount a component with the Autocomplete
    mount(
      <div>
        <Autocomplete
          data-testid="test-autocomplete"
          options={options}
          getOptionLabel={(option) => option.label}
          renderOption={(props, option) => (
            <li {...props} key={option.id} data-testid={`option-${option.id}`}>
              {option.label}
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Select an option" />
          )}
        />
      </div>
    );

    // Get the autocomplete interactable
    const auto = autocomplete("test-autocomplete");

    // Try to select by ID
    auto.selectById("option-2");

    // Verify the selection was made correctly
    auto.selected().should("include", "Option Two");
  });

  it("should select multiple options by ID", () => {
    // Define options with IDs that don't appear directly in the DOM
    const options = [
      { id: "option-1", label: "Option One" },
      { id: "option-2", label: "Option Two" },
      { id: "option-3", label: "Option Three" },
    ];

    // Mount a component with the Autocomplete
    mount(
      <div>
        <Autocomplete
          data-testid="test-autocomplete-multi"
          multiple
          options={options}
          getOptionLabel={(option) => option.label}
          renderOption={(props, option) => (
            <li {...props} key={option.id} data-testid={`option-${option.id}`}>
              {option.label}
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Select options" />
          )}
        />
      </div>
    );

    // Get the autocomplete interactable
    const auto = autocomplete("test-autocomplete-multi");

    // Try to select multiple options by ID
    auto.selectById(["option-1", "option-3"]);

    // Verify the selections were made correctly
    auto.selected().should("deep.equal", ["Option One", "Option Three"]);
  });

  it("should handle reference field selection with data-id attribute", () => {
    // Define options with IDs that match what's used in reference fields
    const options = [
      { _id: "dept-1", name: "Engineering" },
      { _id: "dept-2", name: "Marketing" },
      { _id: "dept-3", name: "Sales" },
    ];

    // Mount a component with the Autocomplete that uses data-id
    mount(
      <div>
        <Autocomplete
          data-testid="test-department-selector"
          options={options}
          getOptionLabel={(option) => option.name}
          renderOption={(props, option) => (
            <li {...props} key={option._id} data-id={option._id}>
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Select department" />
          )}
        />
      </div>
    );

    // Get the autocomplete interactable
    const auto = autocomplete("test-department-selector");

    // Try to select by ID
    auto.selectById("dept-2");

    // Verify the selection was made correctly
    auto.selected().should("include", "Marketing");
  });

  it("should fall back to typing and selecting first option when ID is not found", () => {
    // Define options with display names that contain the ID
    const options = [
      { id: 1, name: "Project 1: Website Redesign" },
      { id: 2, name: "Project 2: Mobile App" },
      { id: 3, name: "Project 3: API Integration" },
    ];

    // Mount a component with the Autocomplete
    mount(
      <div>
        <Autocomplete
          data-testid="test-project-selector"
          options={options}
          getOptionLabel={(option) => option.name}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Select project" />
          )}
        />
      </div>
    );

    // Get the autocomplete interactable
    const auto = autocomplete("test-project-selector");

    // Try to select by ID that doesn't exist directly in the DOM
    // But the ID text appears in the option text
    auto.selectById("project-3");

    // Verify the selection was made (should find and select the option containing "project-3")
    auto.selected().should("include", "Project 3: API Integration");
  });
});
