// SingleChoiceObjectSelector.cy.tsx
// Tests for the SingleChoiceObjectSelector component

/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { z } from "zod";
import { ObjectProvider } from "../../../src/components/FormWithReferences/ObjectProvider";
import { SingleChoiceObjectSelector } from "../../../src/components/ObjectSelector/SingleChoiceObjectSelector";
import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";

describe("SingleChoiceObjectSelector", () => {
  // Sample data for testing
  const options = [
    { _id: "option1", name: "Option 1" },
    { _id: "option2", name: "Option 2" },
    { _id: "option3", name: "Option 3" },
  ];

  // Basic test component
  const TestComponent = ({
    initialValue = null,
    onChange = undefined,
    idField = "_id",
    displayField = "name",
    customOptions = options,
  }: {
    initialValue?: string | null;
    onChange?: (value: string | null) => void;
    idField?: string;
    displayField?: string;
    customOptions?: any[];
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue: string | null) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <div>
        <SingleChoiceObjectSelector
          id="testField"
          name="testField"
          value={value}
          onChange={handleChange}
          options={customOptions}
          idField={idField}
          displayField={displayField}
          label="Test Field"
          data-testid="SingleChoiceObjectSelector"
        />
      </div>
    );
  };

  // Test component with ObjectProvider
  const TestWithObjectProviderComponent = () => {
    // Define a simple schema
    const schema = z.object({
      selectedOption: z.string().optional(),
    });

    // Initial data
    const [data, setData] = useState({
      selectedOption: null,
    });

    const handleChange = (newData: any) => {
      setData((prevData) => ({ ...prevData, ...newData }));
    };

    return (
      <ObjectProvider schema={schema} data={data}>
        <div data-testid="provider-container">
          <SingleChoiceObjectSelector
            id="providerField"
            name="selectedOption"
            value={data.selectedOption}
            onChange={(value) => handleChange({ selectedOption: value })}
            options={options}
            idField="_id"
            displayField="name"
            label="Provider Field"
            data-testid="ProviderSelector"
          />
        </div>
      </ObjectProvider>
    );
  };

  // Helper function to create an AutocompleteInteractable for the component
  const getAutocomplete = (dataTestId = "SingleChoiceObjectSelector") => {
    return new AutocompleteInteractable({
      dataTestId,
    });
  };

  it("should map object ID to value and display name correctly", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent onChange={onChangeSpy} />);

    const autocomplete = getAutocomplete();

    // Open the dropdown
    autocomplete.open();

    // Select an option
    autocomplete.select("Option 1");

    // Verify the onChange was called with the ID value, not the display name
    cy.get("@onChange").should("have.been.calledWith", "option1");

    // Verify the display name is shown in the field
    autocomplete.textField().should("have.value", "Option 1");
  });

  it("should handle custom ID and display field mappings", () => {
    // Sample data with custom ID and display fields
    const customOptions = [
      { itemId: "i1", displayName: "First Item" },
      { itemId: "i2", displayName: "Second Item" },
    ];

    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestComponent
        onChange={onChangeSpy}
        idField="itemId"
        displayField="displayName"
        customOptions={customOptions}
      />
    );

    const autocomplete = getAutocomplete();

    // Open the dropdown
    autocomplete.open();

    // Select an option
    autocomplete.select("First Item");

    // Verify the onChange was called with the custom ID field value
    cy.get("@onChange").should("have.been.calledWith", "i1");

    // Verify the custom display field is shown
    autocomplete.textField().should("have.value", "First Item");
  });

  it("should handle null value correctly", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent initialValue="option1" onChange={onChangeSpy} />);

    const autocomplete = getAutocomplete();

    // Verify initial selection
    autocomplete.textField().should("have.value", "Option 1");

    // Clear the selection
    autocomplete.clearSelection();

    // Verify the onChange was called with null
    cy.get("@onChange").should("have.been.calledWith", null);
  });

  it("should find and select the correct option based on ID value", () => {
    mount(<TestComponent initialValue="option2" />);

    const autocomplete = getAutocomplete();

    // Verify the correct display name is shown for the ID value
    autocomplete.textField().should("have.value", "Option 2");
  });

  it("should work with ObjectProvider", () => {
    mount(<TestWithObjectProviderComponent />);

    const autocomplete = new AutocompleteInteractable({
      dataTestId: "ProviderSelector",
    });

    // Open the dropdown
    autocomplete.open();

    // Select an option
    autocomplete.select("Option 2");

    // Verify the selected value is displayed
    autocomplete.textField().should("have.value", "Option 2");
  });

  it("should handle empty options array gracefully", () => {
    mount(<TestComponent customOptions={[]} />);

    const autocomplete = getAutocomplete();

    // Component should be rendered with empty options
    autocomplete.get().should("exist");

    // Component should not be disabled when options is an empty array
    // It's only disabled when both options and fetchOptions are undefined
    autocomplete.isDisabled().should("be.false");

    // Verify we can click the input (which would open the dropdown if it were not disabled)
    autocomplete.getTriggerElement().click();

    // Verify the dropdown opens (the popper element should exist)
    cy.get(".MuiPopper-root").should("exist");

    // Note: When options array is empty, MUI Autocomplete might not render a listbox element
    // So we don't check for items().should("have.length", 0)
  });

  it("should be disabled when both options and fetchOptions are undefined", () => {
    // Create a component with neither options nor fetchOptions
    const NoOptionsComponent = () => {
      const [value, setValue] = useState<string | null>(null);

      return (
        <div>
          <SingleChoiceObjectSelector
            id="noOptionsField"
            name="noOptionsField"
            value={value}
            onChange={setValue}
            // Explicitly set options and fetchOptions to undefined
            options={undefined}
            fetchOptions={undefined}
            idField="_id"
            displayField="name"
            label="No Options Field"
            data-testid="NoOptionsSelector"
          />
        </div>
      );
    };

    mount(<NoOptionsComponent />);

    const autocomplete = new AutocompleteInteractable({
      dataTestId: "NoOptionsSelector",
    });

    // Component should be rendered but disabled
    autocomplete.get().should("exist");
    autocomplete.isDisabled().should("be.true");

    // Verify that clicking doesn't open the dropdown when disabled
    autocomplete.getTriggerElement().click({ force: true });
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should update selection when value changes externally", () => {
    // Component with external state control
    const ExternalControlComponent = () => {
      const [value, setValue] = useState<string | null>(null);

      return (
        <div>
          <button
            data-testid="change-button"
            onClick={() => setValue("option3")}
          >
            Change Value
          </button>
          <SingleChoiceObjectSelector
            id="externalField"
            name="externalField"
            value={value}
            onChange={setValue}
            options={options}
            idField="_id"
            displayField="name"
            label="External Control Field"
            data-testid="ExternalControlSelector"
          />
        </div>
      );
    };

    mount(<ExternalControlComponent />);

    const autocomplete = new AutocompleteInteractable({
      dataTestId: "ExternalControlSelector",
    });

    // Initially no selection
    autocomplete.textField().should("have.value", "");

    // Change value externally
    cy.get('[data-testid="change-button"]').click();

    // Verify the display name is updated
    autocomplete.textField().should("have.value", "Option 3");
  });
});
