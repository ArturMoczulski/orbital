// MultiObjectSelectUI.interactable.cy.tsx
// Tests for the MultiObjectSelectUI interactable

// @ts-nocheck
/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { MultiObjectSelectUI } from "../../../src/components/ObjectSelector/MultiObjectSelectUI";
import { SynchronousOptionsProvider } from "../../../src/components/ObjectSelector/providers/SynchronousOptionsProvider";
import { multiObjectSelectUI } from "./MultiObjectSelectUI.interactable";

describe("MultiObjectSelectUI.interactable", () => {
  // Sample data for testing
  const options = [
    { id: "option1", name: "Option 1" },
    { id: "option2", name: "Option 2" },
    { id: "option3", name: "Option 3" },
    { id: "option4", name: "Option 4" },
  ];

  // Test component for MultiObjectSelectUI
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
        <MultiObjectSelectUI
          data-field-name="testField"
          value={value}
          onChange={handleChange}
          providerState={new SynchronousOptionsProvider(options).getState()}
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

  it("should select multiple values", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestComponent onChange={onChangeSpy} />);

    const field = multiObjectSelectUI("testField");

    // Select first option
    field.selectById("option1");
    cy.get("@onChange").should("have.been.calledWith", ["option1"]);

    // Select second option (should add to selection, not replace)
    field.selectById("option2");
    cy.get("@onChange").should("have.been.calledWith", ["option1", "option2"]);

    // Verify both values are selected
    field.getValue().should("deep.equal", ["option1", "option2"]);

    // Verify chips are displayed
    field.getSelectedChips().should("deep.equal", ["Option 1", "Option 2"]);
  });

  it("should handle disabled state", () => {
    mount(
      <TestComponent disabled={true} initialValue={["option1", "option2"]} />
    );

    const field = multiObjectSelectUI("testField");

    field.isDisabled().should("be.true");
    field.getValue().should("deep.equal", ["option1", "option2"]);

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestComponent required={true} />);

    const field = multiObjectSelectUI("testField");

    field.isRequired().should("be.true");
  });

  it("should clear all selections", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestComponent
        initialValue={["option1", "option2"]}
        onChange={onChangeSpy}
      />
    );

    const field = multiObjectSelectUI("testField");

    field.getValue().should("deep.equal", ["option1", "option2"]);
    field.getSelectedChips().should("deep.equal", ["Option 1", "Option 2"]);

    field.clearAll();

    cy.get("@onChange").should("have.been.calledWith", []);
    field.getValue().should("deep.equal", []);
    field.getSelectedChips().should("have.length", 0);
  });

  it("should remove individual chips", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestComponent
        initialValue={["option1", "option2", "option3"]}
        onChange={onChangeSpy}
      />
    );

    const field = multiObjectSelectUI("testField");

    field.getValue().should("deep.equal", ["option1", "option2", "option3"]);
    field
      .getSelectedChips()
      .should("deep.equal", ["Option 1", "Option 2", "Option 3"]);

    // Remove the middle chip
    field.removeChip("Option 2");

    cy.get("@onChange").should("have.been.calledWith", ["option1", "option3"]);
    field.getValue().should("deep.equal", ["option1", "option3"]);
    field.getSelectedChips().should("deep.equal", ["Option 1", "Option 3"]);
  });

  it("should handle error state", () => {
    mount(<TestComponent error={true} errorMessage="Invalid selections" />);

    const field = multiObjectSelectUI("testField");

    field.hasError().should("be.true");
    field.getErrorMessage().should("eq", "Invalid selections");
  });

  it("should display placeholder text", () => {
    const customPlaceholder = "Choose multiple items";
    mount(<TestComponent placeholder={customPlaceholder} />);

    const field = multiObjectSelectUI("testField");

    field.getPlaceholder().should("eq", customPlaceholder);
  });

  it("should search for options", () => {
    mount(<TestComponent />);

    const field = multiObjectSelectUI("testField");

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
    field.getValue().should("deep.equal", ["option3"]);
  });

  it("should handle multiple instances with parent element scoping", () => {
    // Create a test component with two identical fields
    const TestComponentWithMultipleFields = () => (
      <div>
        <div data-testid="first-container">
          <MultiObjectSelectUI
            data-field-name="testField"
            value={["option1", "option2"]}
            onChange={() => {}}
            providerState={new SynchronousOptionsProvider(options).getState()}
            label="First Field"
          />
        </div>
        <div data-testid="second-container">
          <MultiObjectSelectUI
            data-field-name="testField"
            value={["option3", "option4"]}
            onChange={() => {}}
            providerState={new SynchronousOptionsProvider(options).getState()}
            label="Second Field"
          />
        </div>
      </div>
    );

    mount(<TestComponentWithMultipleFields />);

    // Create field interactables with different parent elements
    const firstField = multiObjectSelectUI("testField", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = multiObjectSelectUI("testField", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct values
    firstField
      .getSelectedChips()
      .should("deep.equal", ["Option 1", "Option 2"]);
    secondField
      .getSelectedChips()
      .should("deep.equal", ["Option 3", "Option 4"]);
  });

  it("should detect loading state", () => {
    // Create a component that shows loading state
    const LoadingTestComponent = () => {
      const [isLoading, setIsLoading] = useState(true);

      // Create a provider that simulates loading
      const loadingProvider = new SynchronousOptionsProvider(options);
      loadingProvider.isLoading = () => isLoading;

      // Automatically turn off loading after a delay
      setTimeout(() => setIsLoading(false), 500);

      return (
        <div>
          <MultiObjectSelectUI
            data-field-name="testField"
            value={[]}
            onChange={() => {}}
            providerState={loadingProvider.getState()}
            label="Loading Field"
          />
        </div>
      );
    };

    mount(<LoadingTestComponent />);

    const field = multiObjectSelectUI("testField");

    // Initially should be loading
    field.isLoading().should("be.true");

    // After delay, should not be loading
    cy.wait(600);
    field.isLoading().should("be.false");
  });
});
