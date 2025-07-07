// SingleObjectSelectUI.interactable.cy.tsx
// Tests for the SingleObjectSelectUI interactable

// @ts-nocheck
/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { SingleObjectSelectUI } from "../../../src/components/ObjectSelector/SingleObjectSelectUI";
import { SynchronousOptionsProvider } from "../../../src/components/ObjectSelector/providers/SynchronousOptionsProvider";
import { singleObjectSelectUI } from "./SingleObjectSelectUI.interactable";

describe("SingleObjectSelectUI.interactable", () => {
  // Sample data for testing
  const options = [
    { id: "option1", name: "Option 1" },
    { id: "option2", name: "Option 2" },
    { id: "option3", name: "Option 3" },
    { id: "option4", name: "Option 4" },
  ];

  // Test component for SingleObjectSelectUI
  const TestComponent = ({
    disabled = false,
    required = false,
    initialValue = "",
    onChange = undefined,
    error = false,
    errorMessage = "",
    placeholder = "Select an option",
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string;
    onChange?: (value: string) => void;
    error?: boolean;
    errorMessage?: string;
    placeholder?: string;
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue: string) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <div>
        <SingleObjectSelectUI
          fieldName="testField"
          value={value}
          onChange={handleChange}
          providerState={new SynchronousOptionsProvider({
            options,
            idField: "id",
            displayField: "name",
          }).getState()}
          disabled={disabled}
          required={required}
          error={error}
          errorMessage={errorMessage}
          placeholder={placeholder}
          label="Test Field"
        />
      </div>
    );
  };

  it.only("should select a value", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent onChange={onChangeSpy} />);

    // Now try using the interactable to get the value
    const field = singleObjectSelectUI("testField");
    field.selectById("option2");
    field.getValue().should("eq", "option2");
    // Verify the onChange was called with the correct value
    cy.get("@onChange").should("have.been.calledWith", "option2");
    // field.getSelectedText().should("eq", "Option 2");
  });

  it("should handle disabled state", () => {
    mount(<TestComponent disabled={true} initialValue="option1" />);

    const field = singleObjectSelectUI("testField");

    field.isDisabled().should("be.true");
    field.getValue().should("eq", "option1");
    field.getSelectedText().should("eq", "Option 1");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestComponent required={true} />);

    const field = singleObjectSelectUI("testField");

    field.isRequired().should("be.true");
  });

  it("should clear selection", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent initialValue="option1" onChange={onChangeSpy} />);

    const field = singleObjectSelectUI("testField");

    field.getValue().should("eq", "option1");
    field.getSelectedText().should("eq", "Option 1");

    field.clear();

    cy.get("@onChange").should("have.been.calledWith", "");
    field.getValue().should("eq", "");
  });

  it("should handle error state", () => {
    mount(<TestComponent error={true} errorMessage="Invalid selection" />);

    const field = singleObjectSelectUI("testField");

    field.hasError().should("be.true");
    field.getErrorMessage().should("eq", "Invalid selection");
  });

  it("should display placeholder text", () => {
    const customPlaceholder = "Choose an item";
    mount(<TestComponent placeholder={customPlaceholder} />);

    const field = singleObjectSelectUI("testField");

    field.getPlaceholder().should("eq", customPlaceholder);
  });

  it("should search for options", () => {
    mount(<TestComponent />);

    const field = singleObjectSelectUI("testField");

    // Open the dropdown
    field.openDropdown();

    // Search for a specific option
    field.search("Option 3");

    // Verify the filtered options
    field.getItems().then((items) => {
      expect(items.length).to.be.at.most(2); // Should only show Option 3 (and possibly Option 4 if partial match)
      const hasOption3 = items.some((item) => item.getName() === "Option 3");
      expect(hasOption3).to.be.true;
    });

    // Select the filtered option
    field.selectByText("Option 3");
    field.getValue().should("eq", "option3");
  });

  it("should handle multiple instances with parent element scoping", () => {
    // Create a test component with two identical fields
    const TestComponentWithMultipleFields = () => (
      <div>
        <div data-testid="first-container">
          <SingleObjectSelectUI
            fieldName="testField"
            value="option1"
            onChange={() => {}}
            providerState={new SynchronousOptionsProvider({
              options,
              idField: "id",
              displayField: "name",
            }).getState()}
            label="First Field"
          />
        </div>
        <div data-testid="second-container">
          <SingleObjectSelectUI
            fieldName="testField"
            value="option2"
            onChange={() => {}}
            providerState={new SynchronousOptionsProvider({
              options,
              idField: "id",
              displayField: "name",
            }).getState()}
            label="Second Field"
          />
        </div>
      </div>
    );

    mount(<TestComponentWithMultipleFields />);

    // Create field interactables with different parent elements
    const firstField = singleObjectSelectUI("testField", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = singleObjectSelectUI("testField", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct value
    firstField.getSelectedText().should("eq", "Option 1");
    secondField.getSelectedText().should("eq", "Option 2");
  });
});
