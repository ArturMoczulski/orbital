// MultiChoiceObjectSelector.cy.tsx
// Tests for the MultiChoiceObjectSelector component using AutocompleteInteractable

/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { MultiChoiceObjectSelector } from "../../../src/components/ObjectSelector/MultiChoiceObjectSelector";
import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";

describe("MultiChoiceObjectSelector", () => {
  // Sample data for testing
  const options = [
    { _id: "option1", name: "Option 1" },
    { _id: "option2", name: "Option 2" },
    { _id: "option3", name: "Option 3" },
    { _id: "option4", name: "Option 4" },
  ];

  // Test component for MultiChoiceObjectSelector
  const TestComponent = ({
    disabled = false,
    required = false,
    initialValue = [],
    onChange = undefined,
    error = false,
    errorMessage = "",
    placeholder = "Select options",
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string[];
    onChange?: (value: string[]) => void;
    error?: boolean;
    errorMessage?: string;
    placeholder?: string;
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue: string[]) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <div>
        <MultiChoiceObjectSelector
          id="testField"
          name="testField"
          value={value}
          onChange={handleChange}
          options={options}
          idField="_id"
          displayField="name"
          disabled={disabled}
          required={required}
          error={error}
          errorMessage={errorMessage}
          placeholder={placeholder}
          label="Test Field"
          data-testid="MultiChoiceObjectSelector"
        />
      </div>
    );
  };

  // Test component with multiple instances
  const TestMultipleComponent = () => {
    const [value1, setValue1] = useState<string[]>([]);
    const [value2, setValue2] = useState<string[]>([]);

    return (
      <div>
        <div data-testid="first-container">
          <MultiChoiceObjectSelector
            id="firstField"
            name="firstField"
            value={value1}
            onChange={setValue1}
            options={options}
            idField="_id"
            displayField="name"
            label="First Field"
            data-testid="FirstSelector"
          />
        </div>
        <div data-testid="second-container">
          <MultiChoiceObjectSelector
            id="secondField"
            name="secondField"
            value={value2}
            onChange={setValue2}
            options={options}
            idField="_id"
            displayField="name"
            label="Second Field"
            data-testid="SecondSelector"
          />
        </div>
      </div>
    );
  };

  // Helper function to create an AutocompleteInteractable for the component
  const getAutocomplete = (dataTestId = "MultiChoiceObjectSelector") => {
    return new AutocompleteInteractable({
      dataTestId,
    });
  };

  it("should select multiple values", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent onChange={onChangeSpy} />);

    const autocomplete = getAutocomplete();

    // Open the dropdown
    autocomplete.open();

    // Select multiple options
    autocomplete.select("Option 1");
    autocomplete.select("Option 3");

    // Verify the onChange was called with the correct values
    // Note: We can't directly check the arguments of the last call because
    // the spy might be called multiple times with different values
    // Instead, we'll check the selected values in the UI

    // Verify the selected values are displayed as chips
    autocomplete.selected().should("deep.equal", ["Option 1", "Option 3"]);
  });

  it("should handle disabled state", () => {
    mount(
      <TestComponent disabled={true} initialValue={["option1", "option2"]} />
    );

    const autocomplete = getAutocomplete();

    // Verify the component is disabled
    autocomplete.get().should("have.class", "Mui-disabled");

    // Verify the selected values are displayed
    autocomplete.selected().should("deep.equal", ["Option 1", "Option 2"]);

    // Verify that clicking doesn't open the dropdown when disabled
    autocomplete.getTriggerElement().click({ force: true });
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestComponent required={true} />);

    const autocomplete = getAutocomplete();

    // Verify the component is required
    autocomplete.get().find("label").should("have.class", "Mui-required");
  });

  it("should clear selections", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestComponent
        initialValue={["option1", "option2"]}
        onChange={onChangeSpy}
      />
    );

    const autocomplete = getAutocomplete();

    // Verify initial selections
    autocomplete.selected().should("deep.equal", ["Option 1", "Option 2"]);

    // Clear the selections using the clearSelection method
    autocomplete.clearSelection();

    // Verify the onChange was called with an empty array
    cy.get("@onChange").should("have.been.calledWith", []);

    // Verify the selections are cleared
    autocomplete.selected().should("deep.equal", []);
  });

  it("should remove individual selections", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestComponent
        initialValue={["option1", "option2"]}
        onChange={onChangeSpy}
      />
    );

    const autocomplete = getAutocomplete();

    // Verify initial selections
    autocomplete.selected().should("deep.equal", ["Option 1", "Option 2"]);

    // Remove one selection using the deselect method
    autocomplete.deselect("Option 1");

    // Verify only Option 2 remains selected
    autocomplete.selected().should("deep.equal", ["Option 2"]);
  });

  it("should handle error state", () => {
    mount(<TestComponent error={true} errorMessage="Invalid selections" />);

    const autocomplete = getAutocomplete();

    // Verify the component has error state using the Validatable interface
    autocomplete.hasError().should("be.true");

    // Verify the error message is displayed using the Validatable interface
    autocomplete.getError().should("eq", "Invalid selections");
  });

  it("should display placeholder text", () => {
    const customPlaceholder = "Choose multiple items";
    mount(<TestComponent placeholder={customPlaceholder} />);

    const autocomplete = getAutocomplete();

    // Verify the placeholder is displayed
    autocomplete
      .get()
      .find("input")
      .should("have.attr", "placeholder", customPlaceholder);
  });

  it("should search for options", () => {
    mount(<TestComponent />);

    const autocomplete = getAutocomplete();

    // Type in the search box
    autocomplete.type("Option 3");

    // Open the dropdown
    autocomplete.open();

    // Verify the filtered options
    autocomplete.items().then(($items) => {
      // Should only show Option 3
      expect($items.length).to.equal(1);
      expect($items.text()).to.include("Option 3");
    });

    // Select the filtered option
    autocomplete.select("Option 3");

    // Verify the selected value
    autocomplete.selected().should("deep.equal", ["Option 3"]);
  });

  it("should handle multiple instances with parent element scoping", () => {
    mount(<TestMultipleComponent />);

    // Create autocomplete interactables for each instance
    const firstAutocomplete = new AutocompleteInteractable({
      dataTestId: "FirstSelector",
    });

    const secondAutocomplete = new AutocompleteInteractable({
      dataTestId: "SecondSelector",
    });

    // Select different options in each autocomplete
    firstAutocomplete.open();
    firstAutocomplete.select("Option 1");
    firstAutocomplete.select("Option 2");

    secondAutocomplete.open();
    secondAutocomplete.select("Option 3");
    secondAutocomplete.select("Option 4");

    // Verify each autocomplete has the correct selections
    firstAutocomplete.selected().should("deep.equal", ["Option 1", "Option 2"]);
    secondAutocomplete
      .selected()
      .should("deep.equal", ["Option 3", "Option 4"]);
  });

  it("should handle custom field mappings", () => {
    // Sample data with custom ID and display fields
    const customOptions = [
      { itemId: "i1", displayName: "First Item" },
      { itemId: "i2", displayName: "Second Item" },
      { itemId: "i3", displayName: "Third Item" },
    ];

    // Custom test component with custom field mappings
    const CustomFieldsComponent = () => {
      const [value, setValue] = useState<string[]>([]);

      return (
        <div>
          <MultiChoiceObjectSelector
            id="customField"
            name="customField"
            value={value}
            onChange={setValue}
            options={customOptions}
            idField="itemId"
            displayField="displayName"
            label="Custom Field"
            data-testid="CustomFieldSelector"
          />
        </div>
      );
    };

    mount(<CustomFieldsComponent />);

    const autocomplete = new AutocompleteInteractable({
      dataTestId: "CustomFieldSelector",
    });

    // Open the dropdown
    autocomplete.open();

    // Verify the options are displayed with the custom display field
    autocomplete.items().then(($items) => {
      expect($items.length).to.equal(3);
      expect($items.text()).to.include("First Item");
      expect($items.text()).to.include("Second Item");
      expect($items.text()).to.include("Third Item");
    });

    // Select multiple options
    autocomplete.select("First Item");
    autocomplete.select("Third Item");

    // Verify the selected values
    autocomplete.selected().should("deep.equal", ["First Item", "Third Item"]);
  });
});
