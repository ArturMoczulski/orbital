// MultiChoiceObjectSelector.cy.tsx
// Tests for the MultiChoiceObjectSelector component

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
  ];

  // Basic test component
  const TestComponent = ({
    initialValue = [],
    onChange = undefined,
    idField = "_id",
    displayField = "name",
    customOptions = options,
  }: {
    initialValue?: string[];
    onChange?: (value: string[]) => void;
    idField?: string;
    displayField?: string;
    customOptions?: any[];
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
          options={customOptions}
          idField={idField}
          displayField={displayField}
          label="Test Field"
          data-testid="MultiChoiceObjectSelector"
        />
      </div>
    );
  };

  // Helper function to create an AutocompleteInteractable for the component
  const getAutocomplete = (dataTestId = "MultiChoiceObjectSelector") => {
    return new AutocompleteInteractable({
      dataTestId,
    });
  };

  it("should map object IDs to values and display names correctly for multiple selections", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent onChange={onChangeSpy} />);

    const autocomplete = getAutocomplete();

    // Select multiple options
    autocomplete.open();
    autocomplete.select("Option 1");
    autocomplete.open();
    autocomplete.select("Option 2");

    // Verify the onChange was called with an array of ID values
    cy.get("@onChange").should("have.been.calledWith", ["option1", "option2"]);

    // Verify the chips display the correct names
    autocomplete.chips().then((chips) => {
      expect(chips.length).to.equal(2);
      chips[0].label().should("eq", "Option 1");
      chips[1].label().should("eq", "Option 2");
    });

    // Verify selected() returns the correct array of display names
    autocomplete.selected().should("deep.equal", ["Option 1", "Option 2"]);
  });

  it("should handle custom ID and display field mappings for multiple selections", () => {
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

    // Select multiple options
    autocomplete.open();
    autocomplete.select("First Item");
    autocomplete.open();
    autocomplete.select("Second Item");

    // Verify the onChange was called with the custom ID field values
    cy.get("@onChange").should("have.been.calledWith", ["i1", "i2"]);

    // Verify the chips display the correct custom display names
    autocomplete.chips().then((chips) => {
      expect(chips.length).to.equal(2);
      chips[0].label().should("eq", "First Item");
      chips[1].label().should("eq", "Second Item");
    });
  });

  it("should handle removing a specific option when its chip is deleted", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestComponent
        initialValue={["option1", "option2"]}
        onChange={onChangeSpy}
      />
    );

    const autocomplete = getAutocomplete();

    // Verify initial chips
    autocomplete.chips().then((chips) => {
      expect(chips.length).to.equal(2);
    });

    // Remove one option
    autocomplete.deselect("Option 1");

    // Verify the onChange was called with the remaining ID
    cy.get("@onChange").should("have.been.calledWith", ["option2"]);

    // Verify only one chip remains
    autocomplete.chips().then((chips) => {
      expect(chips.length).to.equal(1);
      chips[0].label().should("eq", "Option 2");
    });
  });

  it("should find and select the correct options based on ID values", () => {
    mount(<TestComponent initialValue={["option2", "option3"]} />);

    const autocomplete = getAutocomplete();

    // Verify the correct chips are shown for the ID values
    autocomplete.chips().then((chips) => {
      expect(chips.length).to.equal(2);
      chips[0].label().should("eq", "Option 2");
      chips[1].label().should("eq", "Option 3");
    });

    // Verify selected() returns the correct array
    autocomplete.selected().should("deep.equal", ["Option 2", "Option 3"]);
  });

  it("should update selections when value changes externally", () => {
    // Component with external state control
    const ExternalControlComponent = () => {
      const [value, setValue] = useState<string[]>([]);

      return (
        <div>
          <button
            data-testid="change-button"
            onClick={() => setValue(["option1", "option3"])}
          >
            Change Value
          </button>
          <MultiChoiceObjectSelector
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
    autocomplete.get().find(".MuiChip-root").should("not.exist");

    // Change value externally
    cy.get('[data-testid="change-button"]').click();

    // Verify the chips are updated
    autocomplete.chips().then((chips) => {
      expect(chips.length).to.equal(2);
      chips[0].label().should("eq", "Option 1");
      chips[1].label().should("eq", "Option 3");
    });
  });
});
