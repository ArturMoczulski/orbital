/// <reference types="cypress" />
import {
  CypressInteractable,
  CypressInteractableOptions,
} from "./Cypress.interactable";

/**
 * Test implementation of CypressInteractable for testing purposes
 * This class extends the abstract CypressInteractable class to test its functionality
 */
class TestInteractable extends CypressInteractable {
  constructor(options: CypressInteractableOptions = {}) {
    super(options);
  }

  /**
   * Custom method to test extending the base class functionality
   */
  customAction(): this {
    this.get().then(($el) => {
      cy.wrap($el).trigger("custom-action");
    });
    return this;
  }

  /**
   * Method to get a child element by test ID
   */
  getChildElement(childTestId: string): Cypress.Chainable {
    return this.get().find(`[data-testid="${childTestId}"]`);
  }
}

/**
 * First child test implementation of CypressInteractable
 * This class extends CypressInteractable to test nested interactables
 */
class FirstChildInteractable extends CypressInteractable {
  constructor(options: CypressInteractableOptions = {}) {
    super(options);
  }

  /**
   * Method to get a child element by test ID
   */
  getChildElement(childTestId: string): Cypress.Chainable {
    return this.get().find(`[data-testid="${childTestId}"]`);
  }
}

/**
 * Second child test implementation of CypressInteractable
 * This class extends CypressInteractable to test deeply nested interactables
 */
class SecondChildInteractable extends CypressInteractable {
  constructor(options: CypressInteractableOptions = {}) {
    super(options);
  }

  /**
   * Method to get a child element by test ID
   */
  getChildElement(childTestId: string): Cypress.Chainable {
    return this.get().find(`[data-testid="${childTestId}"]`);
  }

  /**
   * Method to get the text content of this component
   */
  getText(): Cypress.Chainable<string> {
    return this.get().invoke("text");
  }
}

/**
 * Helper function to create a TestInteractable instance
 */
function testComponent(
  options: CypressInteractableOptions = {}
): TestInteractable {
  return new TestInteractable(options);
}

/**
 * Helper function to create a FirstChildInteractable instance
 */
function firstChildComponent(
  options: CypressInteractableOptions = {}
): FirstChildInteractable {
  return new FirstChildInteractable(options);
}

/**
 * Helper function to create a SecondChildInteractable instance
 */
function secondChildComponent(
  options: CypressInteractableOptions = {}
): SecondChildInteractable {
  return new SecondChildInteractable(options);
}

describe("CypressInteractable", () => {
  describe("Constructor and Validation", () => {
    it("should throw an error when neither componentName nor dataTestId is provided", () => {
      // We need to wrap the constructor call in a function to catch the error
      const createInvalidInteractable = () => {
        return new TestInteractable({});
      };

      // Expect the function to throw an error
      expect(createInvalidInteractable).to.throw(
        "At least one of componentName or dataTestId must be provided"
      );
    });

    it("should not throw an error when only componentName is provided", () => {
      const createValidInteractable = () => {
        return new TestInteractable({ htmlElementType: "TestComponent" });
      };

      // Expect the function not to throw an error
      expect(createValidInteractable).not.to.throw();
    });

    it("should not throw an error when only dataTestId is provided", () => {
      const createValidInteractable = () => {
        return new TestInteractable({ dataTestId: "TestComponent" });
      };

      // Expect the function not to throw an error
      expect(createValidInteractable).not.to.throw();
    });
  });

  describe("Selector Method", () => {
    it("should generate correct selector when both componentName and dataTestId are provided", () => {
      const component = new TestInteractable({
        htmlElementType: "div",
        dataTestId: "TestComponent",
      });

      // Access the selector method directly
      expect(component.selector()).to.equal('div[data-testid="TestComponent"]');
    });

    it("should generate correct selector when only componentName is provided", () => {
      const component = new TestInteractable({
        htmlElementType: "div",
      });

      expect(component.selector()).to.equal("div");
    });

    it("should generate correct selector when only dataTestId is provided", () => {
      const component = new TestInteractable({
        dataTestId: "TestComponent",
      });

      expect(component.selector()).to.equal('[data-testid="TestComponent"]');
    });
  });

  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a simple component with test IDs for testing
      cy.mount(
        <div data-testid="ParentContainer">
          <div data-testid="TestComponent" className="test-component">
            <button data-testid="ChildButton">Click Me</button>
            <div data-testid="HoverTarget">Hover Me</div>
          </div>
        </div>
      );
    });

    it("should get the element using dataTestId", () => {
      // Create a TestInteractable instance with dataTestId
      const component = testComponent({ dataTestId: "TestComponent" });

      // Verify the element is found correctly
      component.get().should("exist");
      component.get().should("have.attr", "data-testid", "TestComponent");
    });

    it("should get the element using componentName", () => {
      // Instead of using just "div" which matches multiple elements,
      // let's use a more specific selector that includes the class
      const component = testComponent({
        htmlElementType: "div.test-component",
      });

      // Verify the element is found correctly
      component.get().should("exist");
      component.get().should("have.class", "test-component");
    });

    it("should get the element using both componentName and dataTestId", () => {
      // Create a TestInteractable instance with both componentName and dataTestId
      const component = testComponent({
        htmlElementType: "div",
        dataTestId: "TestComponent",
      });

      // Verify the element is found correctly
      component.get().should("exist");
      component.get().should("have.attr", "data-testid", "TestComponent");
      component.get().should("have.class", "test-component");
    });

    it("should click on the element", () => {
      // Create a TestInteractable instance
      const component = testComponent({ dataTestId: "TestComponent" });

      // Create a click spy
      const clickSpy = cy.spy().as("clickSpy");

      // Attach the spy to the element
      component.get().then(($el) => {
        $el.on("click", clickSpy);
      });

      // Click using the interactable
      component.click();

      // Verify the click was triggered
      cy.get("@clickSpy").should("have.been.called");
    });

    it("should hover over the element", () => {
      // Create a TestInteractable instance
      const component = testComponent({ dataTestId: "TestComponent" });

      // Create spies for the hover events
      const mouseoverSpy = cy.spy().as("mouseoverSpy");
      const mouseenterSpy = cy.spy().as("mouseenterSpy");
      const mousemoveSpy = cy.spy().as("mousemoveSpy");

      // Attach the spies to the element
      component.get().then(($el) => {
        $el.on("mouseover", mouseoverSpy);
        $el.on("mouseenter", mouseenterSpy);
        $el.on("mousemove", mousemoveSpy);
      });

      // Hover using the interactable
      component.hover();

      // Verify the hover events were triggered
      cy.get("@mouseoverSpy").should("have.been.called");
      cy.get("@mouseenterSpy").should("have.been.called");
      cy.get("@mousemoveSpy").should("have.been.called");
    });

    it("should use the should method for assertions", () => {
      // Create a TestInteractable instance
      const component = testComponent({ dataTestId: "TestComponent" });

      // Use the should method directly on the interactable
      component.should("be.visible");
      component.should("have.class", "test-component");
    });

    it("should use custom methods defined in the subclass", () => {
      // Create a TestInteractable instance
      const component = testComponent({ dataTestId: "TestComponent" });

      // Create a spy for the custom action
      const customActionSpy = cy.spy().as("customActionSpy");

      // Attach the spy to the element
      component.get().then(($el) => {
        $el.on("custom-action", customActionSpy);
      });

      // Use the custom method
      component.customAction();

      // Verify the custom action was triggered
      cy.get("@customActionSpy").should("have.been.called");
    });

    it("should get child elements", () => {
      // Create a TestInteractable instance
      const component = testComponent({ dataTestId: "TestComponent" });

      // Get a child element
      component.getChildElement("ChildButton").should("exist");
      component.getChildElement("ChildButton").should("have.text", "Click Me");
    });
  });

  describe("Index Parameter", () => {
    beforeEach(() => {
      // Mount a component with multiple instances of the same element
      cy.mount(
        <div>
          <div data-testid="DuplicateElement" className="element-1">
            First Element
          </div>
          <div data-testid="DuplicateElement" className="element-2">
            Second Element
          </div>
          <div data-testid="DuplicateElement" className="element-3">
            Third Element
          </div>
        </div>
      );
    });

    it("should throw an error when multiple elements match and no index is provided", () => {
      // Create a TestInteractable instance without an index
      const component = testComponent({ dataTestId: "DuplicateElement" });

      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("Multiple elements");
        expect(err.message).to.include("no index parameter was provided");
        return false; // Prevent the error from failing the test
      });

      // This should fail because multiple elements match
      component.get();
    });

    it("should select the correct element when index is provided", () => {
      // Create TestInteractable instances with different indices
      const component0 = testComponent({
        dataTestId: "DuplicateElement",
        index: 0,
      });
      const component1 = testComponent({
        dataTestId: "DuplicateElement",
        index: 1,
      });
      const component2 = testComponent({
        dataTestId: "DuplicateElement",
        index: 2,
      });

      // Verify each component gets the correct element
      component0.get().should("have.class", "element-1");
      component0.get().should("contain", "First Element");

      component1.get().should("have.class", "element-2");
      component1.get().should("contain", "Second Element");

      component2.get().should("have.class", "element-3");
      component2.get().should("contain", "Third Element");
    });

    it("should throw an error when index is out of bounds", () => {
      // Create a TestInteractable instance with an out-of-bounds index
      const component = testComponent({
        dataTestId: "DuplicateElement",
        index: 10,
      });

      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("Index 10 is out of bounds");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the index is out of bounds
      component.get();
    });
  });

  describe("Scoped Functionality", () => {
    beforeEach(() => {
      // Mount a component with multiple instances of the test component
      cy.mount(
        <div>
          <div data-testid="Container1" className="container-1">
            <div data-testid="TestComponent" className="test-component-1">
              <button data-testid="ChildButton">Button 1</button>
            </div>
          </div>
          <div data-testid="Container2" className="container-2">
            <div data-testid="TestComponent" className="test-component-2">
              <button data-testid="ChildButton">Button 2</button>
            </div>
          </div>
        </div>
      );
    });

    it("should scope to a parent element", () => {
      // Create a parent-scoped TestInteractable for the first container
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const component1 = testComponent({
        dataTestId: "TestComponent",
        parentElement: parent1,
      });

      // Create a parent-scoped TestInteractable for the second container
      const parent2 = () => cy.get('[data-testid="Container2"]');
      const component2 = testComponent({
        dataTestId: "TestComponent",
        parentElement: parent2,
      });

      // Verify each component finds the correct scoped element
      component1.get().should("have.class", "test-component-1");
      component2.get().should("have.class", "test-component-2");

      // Verify child elements are correctly scoped
      component1.getChildElement("ChildButton").should("have.text", "Button 1");
      component2.getChildElement("ChildButton").should("have.text", "Button 2");
    });

    it("should maintain parent scope after interactions", () => {
      // Create a parent-scoped TestInteractable for the first container
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const component1 = testComponent({
        dataTestId: "TestComponent",
        parentElement: parent1,
      });

      // Perform an interaction
      component1.click();

      // Verify the scope is maintained by creating a new reference to ensure we're not using a cached element
      const refreshedComponent = testComponent({
        dataTestId: "TestComponent",
        parentElement: parent1,
      });
      refreshedComponent
        .getChildElement("ChildButton")
        .should("have.text", "Button 1");
    });

    it("should throw an error if parentElement is not a function", () => {
      // Get a reference to the element first
      cy.get('[data-testid="Container1"]').then(($container) => {
        // Create a TestInteractable with an invalid parentElement
        // We need to cast to any to bypass TypeScript's type checking
        // since we're intentionally passing an invalid value for testing
        const invalidParentElement = cy.wrap($container) as any;

        const component = new TestInteractable({
          dataTestId: "TestComponent",
          parentElement: invalidParentElement,
        });

        // We'll use cy.on to catch the error
        cy.on("fail", (err) => {
          expect(err.message).to.include("parentElement must be a function");
          return false; // Prevent the error from failing the test
        });

        // This should fail because parentElement is not a function
        component.get();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent elements gracefully", () => {
      // Mount an empty component
      cy.mount(<div></div>);

      // Create a TestInteractable instance for a non-existent element
      const component = testComponent({ dataTestId: "NonExistentElement" });

      // Attempt to get the element with a much shorter timeout (500ms instead of 4000ms)
      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("NonExistentElement");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      // Add a short timeout to make the test run faster
      component.get({ timeout: 100 });
    });

    it("should handle dynamically added elements", () => {
      // Mount a component without the test element
      cy.mount(
        <div data-testid="DynamicContainer" id="dynamic-container"></div>
      );

      // Create a TestInteractable instance
      const component = testComponent({ dataTestId: "TestComponent" });

      // Add the element dynamically
      cy.get("#dynamic-container").then(($container) => {
        const element = document.createElement("div");
        element.setAttribute("data-testid", "TestComponent");
        element.className = "dynamic-element";
        $container[0].appendChild(element);
      });

      // Now the element should exist
      component.get().should("exist");
      component.get().should("have.class", "dynamic-element");
    });

    it("should handle deeply nested interactables without parent mutation", () => {
      // Mount a component with nested test components
      cy.mount(
        <div data-testid="RootContainer">
          <div data-testid="TestComponent" className="parent-component">
            <div data-testid="FirstChildComponent" className="first-child">
              <div data-testid="SecondChildComponent" className="second-child">
                <span data-testid="DeepContent">Deeply Nested Content</span>
              </div>
            </div>
          </div>
        </div>
      );

      // Create the parent interactable
      const parent = testComponent({ dataTestId: "TestComponent" });

      // Create the first child interactable with parent as scope
      const firstChild = firstChildComponent({
        dataTestId: "FirstChildComponent",
        parentElement: () => parent.get(),
      });

      // Create the second child interactable with firstChild as scope
      const secondChild = secondChildComponent({
        dataTestId: "SecondChildComponent",
        parentElement: () => firstChild.get(),
      });

      // Verify initial state
      parent.get().should("have.class", "parent-component");
      firstChild.get().should("have.class", "first-child");
      secondChild.get().should("have.class", "second-child");
      secondChild
        .getChildElement("DeepContent")
        .should("have.text", "Deeply Nested Content");

      // Perform multiple interactions on the deepest child
      secondChild.click();
      secondChild.hover();

      // Get the text from the deepest child
      secondChild.getText().should("contain", "Deeply Nested Content");

      // Verify parent references are still correct after interactions
      // This is the key test for parent mutation issues
      parent.get().should("have.class", "parent-component");
      firstChild.get().should("have.class", "first-child");

      // Verify we can still access the deepest content
      secondChild
        .getChildElement("DeepContent")
        .should("have.text", "Deeply Nested Content");

      // Perform interactions on the parent and verify children still work
      parent.click();
      firstChild.click();

      // Verify deepest child still works after parent interactions
      secondChild.get().should("exist");
      secondChild
        .getChildElement("DeepContent")
        .should("have.text", "Deeply Nested Content");
    });
  });

  describe("Complex Selector Scenarios", () => {
    beforeEach(() => {
      // Mount a component with a variety of elements for testing complex selector scenarios
      cy.mount(
        <div data-testid="ComplexContainer">
          {/* Elements with same dataTestId but different componentName */}
          <div data-testid="SameTestId" className="div-element">
            Div Element
          </div>
          <span data-testid="SameTestId" className="span-element">
            Span Element
          </span>
          <p data-testid="SameTestId" className="p-element">
            Paragraph Element
          </p>

          {/* Elements with same componentName but different dataTestId */}
          <button data-testid="Button1" className="button-element">
            Button 1
          </button>
          <button data-testid="Button2" className="button-element">
            Button 2
          </button>
          <button data-testid="Button3" className="button-element">
            Button 3
          </button>

          {/* Nested containers for parentElement testing */}
          <div data-testid="OuterContainer1" className="outer-container">
            <div data-testid="InnerElement" className="inner-element">
              Inner Element 1
            </div>
          </div>
          <div data-testid="OuterContainer2" className="outer-container">
            <div data-testid="InnerElement" className="inner-element">
              Inner Element 2
            </div>
          </div>

          {/* Elements for testing priority between componentName and dataTestId */}
          <div data-testid="PriorityTest" className="priority-div">
            Priority Div
          </div>
          <span data-testid="PriorityTest" className="priority-span">
            Priority Span
          </span>
        </div>
      );
    });

    it("should prioritize componentName + dataTestId over just dataTestId", () => {
      // Create interactables with different combinations
      const divComponent = testComponent({
        htmlElementType: "div",
        dataTestId: "PriorityTest",
      });

      const spanComponent = testComponent({
        htmlElementType: "span",
        dataTestId: "PriorityTest",
      });

      // Verify each component gets the correct element
      divComponent.get().should("have.class", "priority-div");
      divComponent.get().should("contain", "Priority Div");

      spanComponent.get().should("have.class", "priority-span");
      spanComponent.get().should("contain", "Priority Span");
    });

    it("should handle elements with the same dataTestId but different componentName", () => {
      // Create interactables for each element type
      const divComponent = testComponent({
        htmlElementType: "div",
        dataTestId: "SameTestId",
      });

      const spanComponent = testComponent({
        htmlElementType: "span",
        dataTestId: "SameTestId",
      });

      const pComponent = testComponent({
        htmlElementType: "p",
        dataTestId: "SameTestId",
      });

      // Verify each component gets the correct element
      divComponent.get().should("have.class", "div-element");
      divComponent.get().should("contain", "Div Element");

      spanComponent.get().should("have.class", "span-element");
      spanComponent.get().should("contain", "Span Element");

      pComponent.get().should("have.class", "p-element");
      pComponent.get().should("contain", "Paragraph Element");
    });

    it("should handle elements with the same componentName but different dataTestId", () => {
      // Create interactables for each button
      const button1 = testComponent({
        htmlElementType: "button",
        dataTestId: "Button1",
      });

      const button2 = testComponent({
        htmlElementType: "button",
        dataTestId: "Button2",
      });

      const button3 = testComponent({
        htmlElementType: "button",
        dataTestId: "Button3",
      });

      // Verify each component gets the correct element
      button1.get().should("contain", "Button 1");
      button2.get().should("contain", "Button 2");
      button3.get().should("contain", "Button 3");
    });

    it("should combine index with dataTestId for elements with the same dataTestId", () => {
      // Create interactables with different indices
      const element0 = testComponent({
        dataTestId: "SameTestId",
        index: 0,
      });

      const element1 = testComponent({
        dataTestId: "SameTestId",
        index: 1,
      });

      const element2 = testComponent({
        dataTestId: "SameTestId",
        index: 2,
      });

      // Verify each component gets the correct element
      element0.get().should("have.class", "div-element");
      element0.get().should("contain", "Div Element");

      element1.get().should("have.class", "span-element");
      element1.get().should("contain", "Span Element");

      element2.get().should("have.class", "p-element");
      element2.get().should("contain", "Paragraph Element");
    });

    it("should combine index with componentName for elements with the same componentName", () => {
      // Create interactables with different indices
      const button0 = testComponent({
        htmlElementType: "button",
        index: 0,
      });

      const button1 = testComponent({
        htmlElementType: "button",
        index: 1,
      });

      const button2 = testComponent({
        htmlElementType: "button",
        index: 2,
      });

      // Verify each component gets the correct element
      button0.get().should("contain", "Button 1");
      button1.get().should("contain", "Button 2");
      button2.get().should("contain", "Button 3");
    });

    it("should combine parentElement with dataTestId", () => {
      // Create parent-scoped interactables
      const parent1 = () => cy.get('[data-testid="OuterContainer1"]');
      const innerElement1 = testComponent({
        dataTestId: "InnerElement",
        parentElement: parent1,
      });

      const parent2 = () => cy.get('[data-testid="OuterContainer2"]');
      const innerElement2 = testComponent({
        dataTestId: "InnerElement",
        parentElement: parent2,
      });

      // Verify each component gets the correct element
      innerElement1.get().should("contain", "Inner Element 1");
      innerElement2.get().should("contain", "Inner Element 2");
    });

    it("should combine parentElement with componentName", () => {
      // Create parent-scoped interactables
      const parent1 = () => cy.get('[data-testid="OuterContainer1"]');
      const innerElement1 = testComponent({
        htmlElementType: "div.inner-element",
        parentElement: parent1,
      });

      const parent2 = () => cy.get('[data-testid="OuterContainer2"]');
      const innerElement2 = testComponent({
        htmlElementType: "div.inner-element",
        parentElement: parent2,
      });

      // Verify each component gets the correct element
      innerElement1.get().should("contain", "Inner Element 1");
      innerElement2.get().should("contain", "Inner Element 2");
    });

    it("should combine all selector options (componentName, dataTestId, index, parentElement)", () => {
      // Create a complex container with multiple similar elements
      cy.get('[data-testid="ComplexContainer"]').then(($container) => {
        // Add multiple similar elements to test all selector options together
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 3; i++) {
          const outerDiv = document.createElement("div");
          outerDiv.setAttribute("data-testid", `ComplexOuter${i}`);
          outerDiv.className = "complex-outer";

          for (let j = 0; j < 3; j++) {
            const innerDiv = document.createElement("div");
            innerDiv.setAttribute("data-testid", "ComplexInner");
            innerDiv.className = "complex-inner";
            innerDiv.textContent = `Complex Inner ${i}-${j}`;
            outerDiv.appendChild(innerDiv);
          }

          fragment.appendChild(outerDiv);
        }

        $container[0].appendChild(fragment);
      });

      // Wait for the elements to be added
      cy.get('[data-testid="ComplexOuter0"]').should("exist");

      // Create interactables with all selector options
      const parent0 = () => cy.get('[data-testid="ComplexOuter0"]');
      const element0 = testComponent({
        htmlElementType: "div",
        dataTestId: "ComplexInner",
        index: 1, // Get the second inner element
        parentElement: parent0,
      });

      const parent1 = () => cy.get('[data-testid="ComplexOuter1"]');
      const element1 = testComponent({
        htmlElementType: "div",
        dataTestId: "ComplexInner",
        index: 2, // Get the third inner element
        parentElement: parent1,
      });

      // Verify each component gets the correct element
      element0.get().should("contain", "Complex Inner 0-1");
      element1.get().should("contain", "Complex Inner 1-2");
    });

    it("should handle elements that appear and disappear from the DOM", () => {
      // Add a button to toggle an element's visibility
      cy.get('[data-testid="ComplexContainer"]').then(($container) => {
        const toggleButton = document.createElement("button");
        toggleButton.setAttribute("data-testid", "ToggleButton");
        toggleButton.textContent = "Toggle Element";

        const toggleElement = document.createElement("div");
        toggleElement.setAttribute("data-testid", "ToggleElement");
        toggleElement.className = "toggle-element";
        toggleElement.textContent = "This element can be toggled";
        toggleElement.style.display = "none"; // Start hidden

        toggleButton.addEventListener("click", () => {
          toggleElement.style.display =
            toggleElement.style.display === "none" ? "block" : "none";
        });

        $container[0].appendChild(toggleButton);
        $container[0].appendChild(toggleElement);
      });

      // Create an interactable for the toggle element
      const toggleElement = testComponent({ dataTestId: "ToggleElement" });

      // Initially the element should exist but be hidden
      toggleElement.get().should("exist");
      toggleElement.get().should("not.be.visible");

      // Click the toggle button to show the element
      cy.get('[data-testid="ToggleButton"]').click();

      // Now the element should be visible
      toggleElement.get().should("be.visible");

      // Click the toggle button again to hide the element
      cy.get('[data-testid="ToggleButton"]').click();

      // The element should exist but be hidden again
      toggleElement.get().should("exist");
      toggleElement.get().should("not.be.visible");
    });
  });
});
