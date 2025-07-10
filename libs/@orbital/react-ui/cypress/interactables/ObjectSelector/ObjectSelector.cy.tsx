/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { ObjectSelector } from "../../../src/components/ObjectSelector/ObjectSelector";
import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";

describe("ObjectSelector", () => {
  // Sample data for testing
  const options = [
    { _id: "option1", name: "Option 1" },
    { _id: "option2", name: "Option 2" },
    { _id: "option3", name: "Option 3" },
    { _id: "option4", name: "Option 4" },
  ];

  describe("Single Choice Mode", () => {
    // Basic test component for single choice
    const SingleChoiceTestComponent = ({
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
          <ObjectSelector
            id="testField"
            name="testField"
            value={value}
            onChange={handleChange}
            options={customOptions}
            idField={idField}
            displayField={displayField}
            label="Test Field"
            data-testid="SingleChoiceSelector"
            multiple={false}
          />
        </div>
      );
    };

    // Helper function to create an AutocompleteInteractable for the component
    const getSingleChoiceAutocomplete = (
      dataTestId = "SingleChoiceSelector"
    ) => {
      return new AutocompleteInteractable({
        dataTestId,
      });
    };

    it("should map object ID to value and display name correctly in single choice mode", () => {
      const onChangeSpy = cy.spy().as("onChange");

      mount(<SingleChoiceTestComponent onChange={onChangeSpy} />);

      const autocomplete = getSingleChoiceAutocomplete();

      // Open the dropdown
      autocomplete.open();

      // Select an option
      autocomplete.select("Option 1");

      // Verify the onChange was called with the ID value, not the display name
      cy.get("@onChange").should("have.been.calledWith", "option1");

      // Verify the display name is shown in the field
      autocomplete.textField().should("have.value", "Option 1");
    });

    it("should handle custom ID and display field mappings in single choice mode", () => {
      // Sample data with custom ID and display fields
      const customOptions = [
        { itemId: "i1", displayName: "First Item" },
        { itemId: "i2", displayName: "Second Item" },
      ];

      const onChangeSpy = cy.spy().as("onChange");

      mount(
        <SingleChoiceTestComponent
          onChange={onChangeSpy}
          idField="itemId"
          displayField="displayName"
          customOptions={customOptions}
        />
      );

      const autocomplete = getSingleChoiceAutocomplete();

      // Open the dropdown
      autocomplete.open();

      // Select an option
      autocomplete.select("First Item");

      // Verify the onChange was called with the custom ID field value
      cy.get("@onChange").should("have.been.calledWith", "i1");

      // Verify the custom display field is shown
      autocomplete.textField().should("have.value", "First Item");
    });

    it("should handle null value correctly in single choice mode", () => {
      const onChangeSpy = cy.spy().as("onChange");

      mount(
        <SingleChoiceTestComponent
          initialValue="option1"
          onChange={onChangeSpy}
        />
      );

      const autocomplete = getSingleChoiceAutocomplete();

      // Verify initial selection
      autocomplete.textField().should("have.value", "Option 1");

      // Clear the selection
      autocomplete.clearSelection();

      // Verify the onChange was called with null
      cy.get("@onChange").should("have.been.calledWith", null);
    });

    it("should display loading indicator when fetching options asynchronously in single choice mode", () => {
      // Component with async loading
      const AsyncLoadingComponent = () => {
        const [value, setValue] = useState<string | null>(null);

        // Simulated async fetch function that shows loading state immediately
        const fetchAsyncOptions = (query?: string) => {
          // Return a promise that resolves after a short delay
          return new Promise<any[]>((resolve) => {
            // Use a timeout to simulate network delay
            setTimeout(() => {
              resolve(options);
            }, 500); // Use a consistent short delay for testing
          });
        };

        return (
          <div>
            <ObjectSelector
              id="asyncField"
              name="asyncField"
              value={value}
              onChange={setValue}
              fetchOptions={fetchAsyncOptions}
              idField="_id"
              displayField="name"
              label="Async Loading Field"
              data-testid="AsyncLoadingSelector"
              multiple={false}
            />
          </div>
        );
      };

      mount(<AsyncLoadingComponent />);

      const autocomplete = new AutocompleteInteractable({
        dataTestId: "AsyncLoadingSelector",
      });

      // Open the selector - this should trigger fetchOptions and show loading
      autocomplete.open();

      // Verify loading state using the isLoading method
      autocomplete.isLoading().should("be.true");

      // Check for the loading indicator directly
      cy.get('.MuiAutocomplete-root[data-testid="AsyncLoadingSelector"]')
        .should("exist")
        .within(() => {
          cy.get(".MuiCircularProgress-root").should("exist");
        });

      // Wait for loading to complete
      cy.wait(600);

      // Verify loading state is removed after fetch completes
      autocomplete.isLoading().should("be.false");

      // Verify options are loaded and can be selected
      autocomplete.items().should("have.length", options.length);
      autocomplete.select("Option 2");
      autocomplete.textField().should("have.value", "Option 2");
    });

    it("should correctly display pre-existing selection when hydrated in single choice mode", () => {
      // Mount component with an initial value
      mount(<SingleChoiceTestComponent initialValue="option2" />);

      const autocomplete = getSingleChoiceAutocomplete();

      // Verify the correct option is displayed without any user interaction
      autocomplete.textField().should("have.value", "Option 2");

      // Verify the component is properly hydrated by checking the internal state
      cy.get('[data-testid="SingleChoiceSelector"]')
        .should("exist")
        .find("input")
        .should("have.value", "Option 2");
    });
  });

  describe("Multiple Choice Mode", () => {
    // Test component for multiple choice
    const MultiChoiceTestComponent = () => {
      const [selector1Value, setSelector1Value] = useState<string[]>([]);
      const [selector2Value, setSelector2Value] = useState<string[]>([]);
      const [selector3Value, setSelector3Value] = useState<string[]>([]);
      const [selector4Value, setSelector4Value] = useState<string[]>([]);

      // Simulated async fetch function that shows loading state immediately
      const fetchAsyncOptions = (query?: string) => {
        // Return a promise that resolves after a short delay
        return new Promise<any[]>((resolve) => {
          // Use a timeout to simulate network delay
          setTimeout(() => {
            resolve(options);
          }, 500); // Use a consistent short delay for testing
        });
      };

      return (
        <div>
          <div>
            <h3>Selector 1</h3>
            <ObjectSelector
              id="selector1"
              name="selector1"
              value={selector1Value}
              onChange={setSelector1Value}
              options={options}
              idField="_id"
              displayField="name"
              label="Selector 1"
              data-testid="selector1"
              multiple={true}
            />
            <div data-testid="selector1-value">
              {JSON.stringify(selector1Value)}
            </div>
          </div>

          <div>
            <h3>Selector 2</h3>
            <ObjectSelector
              id="selector2"
              name="selector2"
              value={selector2Value}
              onChange={setSelector2Value}
              options={options}
              idField="_id"
              displayField="name"
              label="Selector 2"
              data-testid="selector2"
              multiple={true}
            />
            <div data-testid="selector2-value">
              {JSON.stringify(selector2Value)}
            </div>
          </div>

          <div>
            <h3>Selector 3 (Async Loading)</h3>
            <ObjectSelector
              id="selector3"
              name="selector3"
              value={selector3Value}
              onChange={setSelector3Value}
              fetchOptions={fetchAsyncOptions}
              idField="_id"
              displayField="name"
              label="Selector 3 (Async Loading)"
              data-testid="selector3"
              multiple={true}
            />
            <div data-testid="selector3-value">
              {JSON.stringify(selector3Value)}
            </div>
          </div>

          <div>
            <h3>Selector 4 (Error)</h3>
            <ObjectSelector
              id="selector4"
              name="selector4"
              value={selector4Value}
              onChange={setSelector4Value}
              options={options}
              idField="_id"
              displayField="name"
              label="Selector 4 (Error)"
              error={true}
              errorMessage="This field has an error"
              data-testid="selector4"
              multiple={true}
            />
            <div data-testid="selector4-value">
              {JSON.stringify(selector4Value)}
            </div>
          </div>
        </div>
      );
    };

    // Helper function to create an AutocompleteInteractable for a specific selector
    const getMultiChoiceAutocomplete = (dataTestId: string) => {
      return new AutocompleteInteractable({
        dataTestId,
      });
    };

    it("should allow multiple selectors to work independently in multiple choice mode", () => {
      mount(<MultiChoiceTestComponent />);

      // Get interactables for the first two selectors
      const selector1 = getMultiChoiceAutocomplete("selector1");
      const selector2 = getMultiChoiceAutocomplete("selector2");

      // Select options in the first selector
      selector1.open();
      selector1.select("Option 1");
      selector1.open();
      selector1.select("Option 3");

      // Verify selections in the first selector
      cy.get('[data-testid="selector1-value"]').should(
        "contain",
        '["option1","option3"]'
      );

      // Select different options in the second selector
      selector2.open();
      selector2.select("Option 2");
      selector2.open();
      selector2.select("Option 4");

      // Verify selections in the second selector
      cy.get('[data-testid="selector2-value"]').should(
        "contain",
        '["option2","option4"]'
      );

      // Verify first selector still has its original selections
      cy.get('[data-testid="selector1-value"]').should(
        "contain",
        '["option1","option3"]'
      );
    });

    it("should handle selecting and deselecting multiple options in multiple choice mode", () => {
      mount(<MultiChoiceTestComponent />);

      const selector = getMultiChoiceAutocomplete("selector1");

      // Select multiple options
      selector.open();
      selector.select("Option 1");
      selector.open();
      selector.select("Option 2");
      selector.open();
      selector.select("Option 3");

      // Verify all options are selected
      cy.get('[data-testid="selector1-value"]').should(
        "contain",
        '["option1","option2","option3"]'
      );

      // Verify chips display the correct names
      selector.chips().then((chips) => {
        expect(chips.length).to.equal(3);
        chips[0].label().should("eq", "Option 1");
        chips[1].label().should("eq", "Option 2");
        chips[2].label().should("eq", "Option 3");
      });

      // Deselect one option
      selector.deselect("Option 2");

      // Verify the option was removed
      cy.get('[data-testid="selector1-value"]').should(
        "contain",
        '["option1","option3"]'
      );

      // Verify chips reflect the change
      selector.chips().then((chips) => {
        expect(chips.length).to.equal(2);
        chips[0].label().should("eq", "Option 1");
        chips[1].label().should("eq", "Option 3");
      });

      // Clear all selections
      selector.clearSelection();

      // Verify all selections are cleared
      cy.get('[data-testid="selector1-value"]').should("contain", "[]");
      selector.get().find(".MuiChip-root").should("not.exist");
    });

    it("should display loading indicator when fetching options asynchronously in multiple choice mode", () => {
      mount(<MultiChoiceTestComponent />);

      const loadingSelector = getMultiChoiceAutocomplete("selector3");

      // Open the selector - this should trigger fetchOptions and show loading
      loadingSelector.open();

      // Add a longer wait to ensure the loading state is set
      cy.wait(100);

      // Verify loading state using the isLoading method
      loadingSelector.isLoading().should("be.true");

      // Also verify the CircularProgress component is visible
      cy.get('.MuiAutocomplete-root[data-testid="selector3"]')
        .should("exist")
        .within(() => {
          cy.get(".MuiCircularProgress-root").should("exist");
        });

      // Wait for loading to complete (using a consistent short delay)
      cy.wait(600);

      // Verify loading state is removed after fetch completes
      loadingSelector.isLoading().should("be.false");
    });

    it("should display error state correctly in multiple choice mode", () => {
      mount(<MultiChoiceTestComponent />);

      const errorSelector = getMultiChoiceAutocomplete("selector4");

      // Verify error styling is applied
      errorSelector.hasError().should("be.true");

      // Verify error message is displayed
      errorSelector.getError().should("eq", "This field has an error");
    });

    it("should correctly display pre-existing selections when hydrated in multiple choice mode", () => {
      // Create a component with initial values
      const HydratedMultiChoiceComponent = () => {
        const [value, setValue] = useState<string[]>(["option1", "option3"]);

        return (
          <div>
            <ObjectSelector
              id="hydratedSelector"
              name="hydratedSelector"
              value={value}
              onChange={setValue}
              options={options}
              idField="_id"
              displayField="name"
              label="Hydrated Selector"
              data-testid="hydratedSelector"
              multiple={true}
            />
            <div data-testid="hydrated-value">{JSON.stringify(value)}</div>
          </div>
        );
      };

      mount(<HydratedMultiChoiceComponent />);

      const selector = getMultiChoiceAutocomplete("hydratedSelector");

      // Verify the correct options are displayed without any user interaction
      cy.get('[data-testid="hydrated-value"]').should(
        "contain",
        '["option1","option3"]'
      );

      // Verify chips display the correct names
      selector.chips().then((chips) => {
        expect(chips.length).to.equal(2);
        chips[0].label().should("eq", "Option 1");
        chips[1].label().should("eq", "Option 3");
      });
    });
  });
});
