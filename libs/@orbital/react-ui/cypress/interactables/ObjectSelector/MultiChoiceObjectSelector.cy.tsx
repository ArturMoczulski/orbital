/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { MultiChoiceObjectSelector } from "../../../src/components/ObjectSelector/MultiChoiceObjectSelector";
import { AutocompleteInteractable } from "../MaterialUI/Autocomplete.interactable";

describe("MultiChoiceObjectSelector", () => {
  // Sample data for testing
  const basicOptions = [
    { _id: "option1", name: "Option 1" },
    { _id: "option2", name: "Option 2" },
    { _id: "option3", name: "Option 3" },
    { _id: "option4", name: "Option 4" },
  ];

  // Test component with multiple MultiChoiceObjectSelector instances
  const TestMultipleSelectorsComponent = () => {
    const [selector1Value, setSelector1Value] = useState<string[]>([]);
    const [selector2Value, setSelector2Value] = useState<string[]>([]);
    const [selector3Value, setSelector3Value] = useState<string[]>([]);
    const [selector4Value, setSelector4Value] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Simulated async fetch function that shows loading state
    const fetchAsyncOptions = (query?: string) => {
      // Set loading state to true when fetch starts
      setIsLoading(true);

      // Return a promise that resolves after a delay
      return new Promise<any[]>((resolve) => {
        // Use a timeout to simulate network delay
        setTimeout(
          () => {
            setIsLoading(false);
            resolve(basicOptions);
          },
          isLoading ? 5000 : 100
        ); // Long delay when isLoading is true, short when false
      });
    };

    // Function to toggle between fast and slow loading
    const toggleLoading = () => {
      setIsLoading(!isLoading);
    };

    return (
      <div>
        <div>
          <h3>Selector 1</h3>
          <MultiChoiceObjectSelector
            id="selector1"
            name="selector1"
            value={selector1Value}
            onChange={setSelector1Value}
            options={basicOptions}
            idField="_id"
            displayField="name"
            label="Selector 1"
            data-testid="selector1"
          />
          <div data-testid="selector1-value">
            {JSON.stringify(selector1Value)}
          </div>
        </div>

        <div>
          <h3>Selector 2</h3>
          <MultiChoiceObjectSelector
            id="selector2"
            name="selector2"
            value={selector2Value}
            onChange={setSelector2Value}
            options={basicOptions}
            idField="_id"
            displayField="name"
            label="Selector 2"
            data-testid="selector2"
          />
          <div data-testid="selector2-value">
            {JSON.stringify(selector2Value)}
          </div>
        </div>

        <div>
          <h3>Selector 3 (Async Loading)</h3>
          <button data-testid="toggle-loading" onClick={toggleLoading}>
            {isLoading ? "Fast Loading" : "Slow Loading"}
          </button>
          <MultiChoiceObjectSelector
            id="selector3"
            name="selector3"
            value={selector3Value}
            onChange={setSelector3Value}
            fetchOptions={fetchAsyncOptions}
            idField="_id"
            displayField="name"
            label="Selector 3 (Async Loading)"
            data-testid="selector3"
          />
          <div data-testid="selector3-value">
            {JSON.stringify(selector3Value)}
          </div>
        </div>

        <div>
          <h3>Selector 4 (Error)</h3>
          <MultiChoiceObjectSelector
            id="selector4"
            name="selector4"
            value={selector4Value}
            onChange={setSelector4Value}
            options={basicOptions}
            idField="_id"
            displayField="name"
            label="Selector 4 (Error)"
            error={true}
            errorMessage="This field has an error"
            data-testid="selector4"
          />
          <div data-testid="selector4-value">
            {JSON.stringify(selector4Value)}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to create an AutocompleteInteractable for a specific selector
  const getAutocomplete = (dataTestId: string) => {
    return new AutocompleteInteractable({
      dataTestId,
    });
  };

  describe("Basic functionality", () => {
    beforeEach(() => {
      mount(<TestMultipleSelectorsComponent />);
    });

    it("should allow multiple selectors to work independently", () => {
      // Get interactables for the first two selectors
      const selector1 = getAutocomplete("selector1");
      const selector2 = getAutocomplete("selector2");

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

    it("should handle selecting and deselecting multiple options", () => {
      const selector = getAutocomplete("selector1");

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

    it("should display loading indicator when fetching options asynchronously", () => {
      const loadingSelector = getAutocomplete("selector3");

      // Set to slow loading
      cy.get('[data-testid="toggle-loading"]').click();

      // Open the selector - this should trigger fetchOptions and show loading
      loadingSelector.open();

      // Verify loading state using the isLoading method
      loadingSelector.isLoading().should("be.true");

      // Wait for loading to complete (the timeout in fetchAsyncOptions)
      cy.wait(5500);

      // Verify loading state is removed after fetch completes
      loadingSelector.isLoading().should("be.false");
    });

    it("should display error state correctly", () => {
      const errorSelector = getAutocomplete("selector4");

      // Verify error styling is applied
      errorSelector.hasError().should("be.true");

      // Verify error message is displayed
      errorSelector.getError().should("eq", "This field has an error");
    });
  });

  describe("Integration with multiple selectors", () => {
    beforeEach(() => {
      mount(<TestMultipleSelectorsComponent />);
    });

    it("should maintain selections when interacting with other selectors", () => {
      const selector1 = getAutocomplete("selector1");
      const selector2 = getAutocomplete("selector2");

      // Select options in the first selector
      selector1.open();
      selector1.select("Option 1");
      selector1.open();
      selector1.select("Option 3");

      // Interact with the second selector
      selector2.open();
      selector2.select("Option 2");

      // Verify first selector still has its selections
      selector1.chips().then((chips) => {
        expect(chips.length).to.equal(2);
        chips[0].label().should("eq", "Option 1");
        chips[1].label().should("eq", "Option 3");
      });

      // Add another selection to the first selector
      selector1.open();
      selector1.select("Option 4");

      // Verify all selections in the first selector
      selector1.chips().then((chips) => {
        expect(chips.length).to.equal(3);
        chips[0].label().should("eq", "Option 1");
        chips[1].label().should("eq", "Option 3");
        chips[2].label().should("eq", "Option 4");
      });

      // Verify second selector still has its selection
      selector2.chips().then((chips) => {
        expect(chips.length).to.equal(1);
        chips[0].label().should("eq", "Option 2");
      });
    });
  });
});
