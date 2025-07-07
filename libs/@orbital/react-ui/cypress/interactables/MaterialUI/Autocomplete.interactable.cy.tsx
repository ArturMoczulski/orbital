// Autocomplete.interactable.cy.tsx
// Tests for the Material UI Autocomplete interactable

/// <reference types="cypress" />
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";
import { useState } from "react";
import { autocomplete } from "./Autocomplete.interactable";

describe("Autocomplete.interactable", () => {
  // Sample data for testing
  const options = [
    { id: "option1", label: "Option 1" },
    { id: "option2", label: "Option 2" },
    { id: "option3", label: "Option 3" },
    { id: "option4", label: "Option 4" },
  ];

  // Test component for Material UI Autocomplete
  const TestComponent = ({
    disabled = false,
    required = false,
    initialValue = null,
    onChange = undefined,
    error = false,
    errorMessage = "",
    placeholder = "Select an option",
    loading = false,
    multiple = false,
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: any;
    onChange?: (value: any) => void;
    error?: boolean;
    errorMessage?: string;
    placeholder?: string;
    loading?: boolean;
    multiple?: boolean;
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (_: any, newValue: any) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <Autocomplete
        value={value}
        onChange={handleChange}
        options={options}
        getOptionLabel={(option) => {
          // Handle both string and object options
          if (typeof option === "string") return option;
          return option.label || "";
        }}
        loading={loading}
        disabled={disabled}
        multiple={multiple}
        {...{ "data-testid": "TestableAutocomplete" }}
        renderInput={(params) => (
          <TextField
            {...params}
            name="testField"
            label="Test Field"
            placeholder={placeholder}
            error={error}
            helperText={errorMessage}
            required={required}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li
            {...props}
            data-value-id={option.id}
            data-option-id={option.id}
            data-field-name="testField"
          >
            {option.label}
          </li>
        )}
      />
    );
  };

  it("should find component by selector with test id", () => {
    mount(<TestComponent />);

    // Use the interactable to select a value
    const field = autocomplete(undefined, undefined, "TestableAutocomplete");
    field.should("exist");
  });

  it("should find component by selector with field name", () => {
    mount(<TestComponent />);

    // Use the interactable to select a value
    const field = autocomplete("testField");
    field.should("exist");
  });

  it("should find all components", () => {
    mount(
      <>
        <TestComponent />
        <TestComponent />
      </>
    );

    // Use the interactable to select a value
    const field1 = autocomplete(undefined, undefined, undefined, 0);
    field1.should("exist");
    const field2 = autocomplete(undefined, undefined, undefined, 1);
    field2.should("exist");
  });

  it.only("should select a value", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent onChange={onChangeSpy} />);

    // Use the interactable to select a value
    const field = autocomplete("testField");
    field.selectById("option2");
    field.getValue().should("eq", "option2");
    field.getDisplayText().should("eq", "Option 2");

    // Verify the onChange was called with the correct value
    cy.get("@onChange").should("have.been.called");
  });

  it("should handle disabled state", () => {
    // Find the option with id "option1"
    const initialValue = options.find((option) => option.id === "option1");

    mount(<TestComponent disabled={true} initialValue={initialValue} />);

    const field = autocomplete("testField");

    field.isDisabled().should("be.true");
    field.getDisplayText().should("eq", "Option 1");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestComponent required={true} />);

    const field = autocomplete("testField");

    field.isRequired().should("be.true");
  });

  it("should clear selection", () => {
    const onChangeSpy = cy.spy().as("onChange");
    const initialValue = options.find((option) => option.id === "option1");

    mount(<TestComponent initialValue={initialValue} onChange={onChangeSpy} />);

    const field = autocomplete("testField");

    field.getDisplayText().should("eq", "Option 1");

    field.clear();

    cy.get("@onChange").should("have.been.called");
    field.getDisplayText().should("eq", "");
  });

  it("should handle error state", () => {
    mount(<TestComponent error={true} errorMessage="Invalid selection" />);

    const field = autocomplete("testField");

    field.hasError().should("be.true");
    field.getErrorMessage().should("eq", "Invalid selection");
  });

  it("should display placeholder text", () => {
    const customPlaceholder = "Choose an item";
    mount(<TestComponent placeholder={customPlaceholder} />);

    const field = autocomplete("testField");

    field.getPlaceholder().should("eq", customPlaceholder);
  });

  it("should search for options", () => {
    mount(<TestComponent />);

    const field = autocomplete("testField");

    // Open the dropdown
    field.openDropdown();

    // Search for a specific option
    field.search("Option 3");

    // Verify the filtered options
    field.getOptions().then((options) => {
      expect(options.length).to.be.at.most(2); // Should only show Option 3 (and possibly Option 4 if partial match)
      const hasOption3 = options.some(
        (option) => option.getText() === "Option 3"
      );
      expect(hasOption3).to.be.true;
    });

    // Select the filtered option
    field.selectByText("Option 3");
    field.getValue().should("eq", "option3");
  });

  it("should handle loading state", () => {
    mount(<TestComponent loading={true} />);

    const field = autocomplete("testField");

    field.isLoading().should("be.true");
  });

  it("should handle multiple instances with parent element scoping", () => {
    // Create a test component with two identical fields
    const TestComponentWithMultipleFields = () => (
      <div>
        <div data-testid="first-container" data-field-name="testField">
          <Autocomplete
            id="first-autocomplete"
            value={options[0]}
            onChange={() => {}}
            options={options}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                name="testField"
                label="First Field"
                fullWidth
                margin="normal"
                variant="outlined"
              />
            )}
            renderOption={(props, option) => (
              <li
                {...props}
                data-value-id={option.id}
                data-field-name="testField"
              >
                {option.label}
              </li>
            )}
          />
        </div>
        <div data-testid="second-container" data-field-name="testField">
          <Autocomplete
            id="second-autocomplete"
            value={options[1]}
            onChange={() => {}}
            options={options}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                name="testField"
                label="Second Field"
                fullWidth
                margin="normal"
                variant="outlined"
              />
            )}
            renderOption={(props, option) => (
              <li
                {...props}
                data-value-id={option.id}
                data-field-name="testField"
              >
                {option.label}
              </li>
            )}
          />
        </div>
      </div>
    );

    mount(<TestComponentWithMultipleFields />);

    // Create field interactables with different parent elements
    const firstField = autocomplete("testField", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = autocomplete("testField", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct value
    firstField.getDisplayText().should("eq", "Option 1");
    secondField.getDisplayText().should("eq", "Option 2");
  });
});
