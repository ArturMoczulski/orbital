/// <reference types="cypress" />
import { CypressInteractable } from "./Cypress.interactable";

/**
 * Test implementation of CypressInteractable for testing purposes
 * This class extends the abstract CypressInteractable class to test its functionality
 */
class TestInteractable extends CypressInteractable<"TestComponent"> {
  constructor(parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>) {
    super("TestComponent", parentElement);
  }

  /**
   * Custom method to test extending the base class functionality
   */
  customAction(): this {
    this.getElement().then(($el) => {
      cy.wrap($el).trigger("custom-action");
    });
    return this;
  }

  /**
   * Method to get a child element by test ID
   */
  getChildElement(childTestId: string): Cypress.Chainable {
    return this.getElement().find(`[data-testid="${childTestId}"]`);
  }

  /**
   * Method to test the findElement override
   */
  protected override findElement() {
    // For testing purposes, we'll add a custom selector to the base implementation
    return this.getElement().filter(":visible");
  }
}

/**
 * First child test implementation of CypressInteractable
 * This class extends TestInteractable to test nested interactables
 */
class FirstChildInteractable extends CypressInteractable<"FirstChildComponent"> {
  constructor(parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>) {
    super("FirstChildComponent", parentElement);
  }

  /**
   * Method to get a child element by test ID
   */
  getChildElement(childTestId: string): Cypress.Chainable {
    return this.getElement().find(`[data-testid="${childTestId}"]`);
  }
}

/**
 * Second child test implementation of CypressInteractable
 * This class extends CypressInteractable to test deeply nested interactables
 */
class SecondChildInteractable extends CypressInteractable<"SecondChildComponent"> {
  constructor(parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>) {
    super("SecondChildComponent", parentElement);
  }

  /**
   * Method to get a child element by test ID
   */
  getChildElement(childTestId: string): Cypress.Chainable {
    return this.getElement().find(`[data-testid="${childTestId}"]`);
  }

  /**
   * Method to get the text content of this component
   */
  getText(): Cypress.Chainable<string> {
    return this.getElement().invoke("text");
  }
}

/**
 * Helper function to create a TestInteractable instance
 */
function testComponent(
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): TestInteractable {
  return new TestInteractable(parentElement);
}

/**
 * Helper function to create a FirstChildInteractable instance
 */
function firstChildComponent(
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): FirstChildInteractable {
  return new FirstChildInteractable(parentElement);
}

/**
 * Helper function to create a SecondChildInteractable instance
 */
function secondChildComponent(
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): SecondChildInteractable {
  return new SecondChildInteractable(parentElement);
}

describe("CypressInteractable", () => {
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

    it("should get the element using data-testid", () => {
      // Create a TestInteractable instance
      const component = testComponent();

      // Verify the element is found correctly
      component.getElement().should("exist");
      component
        .getElement()
        .should("have.attr", "data-testid", "TestComponent");
    });

    it("should click on the element", () => {
      // Create a TestInteractable instance
      const component = testComponent();

      // Create a click spy
      const clickSpy = cy.spy().as("clickSpy");

      // Attach the spy to the element
      component.getElement().then(($el) => {
        $el.on("click", clickSpy);
      });

      // Click using the interactable
      component.click();

      // Verify the click was triggered
      cy.get("@clickSpy").should("have.been.called");
    });

    it("should hover over the element", () => {
      // Create a TestInteractable instance
      const component = testComponent();

      // Create spies for the hover events
      const mouseoverSpy = cy.spy().as("mouseoverSpy");
      const mouseenterSpy = cy.spy().as("mouseenterSpy");
      const mousemoveSpy = cy.spy().as("mousemoveSpy");

      // Attach the spies to the element
      component.getElement().then(($el) => {
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
      const component = testComponent();

      // Use the should method directly on the interactable
      component.should("be.visible");
      component.should("have.class", "test-component");
    });

    it("should use custom methods defined in the subclass", () => {
      // Create a TestInteractable instance
      const component = testComponent();

      // Create a spy for the custom action
      const customActionSpy = cy.spy().as("customActionSpy");

      // Attach the spy to the element
      component.getElement().then(($el) => {
        $el.on("custom-action", customActionSpy);
      });

      // Use the custom method
      component.customAction();

      // Verify the custom action was triggered
      cy.get("@customActionSpy").should("have.been.called");
    });

    it("should get child elements", () => {
      // Create a TestInteractable instance
      const component = testComponent();

      // Get a child element
      component.getChildElement("ChildButton").should("exist");
      component.getChildElement("ChildButton").should("have.text", "Click Me");
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
      const component1 = testComponent(parent1);

      // Create a parent-scoped TestInteractable for the second container
      const parent2 = () => cy.get('[data-testid="Container2"]');
      const component2 = testComponent(parent2);

      // Verify each component finds the correct scoped element
      component1.getElement().should("have.class", "test-component-1");
      component2.getElement().should("have.class", "test-component-2");

      // Verify child elements are correctly scoped
      component1.getChildElement("ChildButton").should("have.text", "Button 1");
      component2.getChildElement("ChildButton").should("have.text", "Button 2");
    });

    it("should maintain parent scope after interactions", () => {
      // Create a parent-scoped TestInteractable for the first container
      const parent1 = () => cy.get('[data-testid="Container1"]');
      const component1 = testComponent(parent1);

      // Perform an interaction
      component1.click();

      // Verify the scope is maintained
      component1.getChildElement("ChildButton").should("have.text", "Button 1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent elements gracefully", () => {
      // Mount an empty component
      cy.mount(<div></div>);

      // Create a TestInteractable instance for a non-existent element
      const component = testComponent();

      // Attempt to get the element (should fail with a clear error)
      // We'll use cy.on to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("TestComponent");
        return false; // Prevent the error from failing the test
      });

      // This should fail because the element doesn't exist
      component.getElement();
    });

    it("should handle dynamically added elements", () => {
      // Mount a component without the test element
      cy.mount(
        <div data-testid="DynamicContainer" id="dynamic-container"></div>
      );

      // Create a TestInteractable instance
      const component = testComponent();

      // Add the element dynamically
      cy.get("#dynamic-container").then(($container) => {
        const element = document.createElement("div");
        element.setAttribute("data-testid", "TestComponent");
        element.className = "dynamic-element";
        $container[0].appendChild(element);
      });

      // Now the element should exist
      component.getElement().should("exist");
      component.getElement().should("have.class", "dynamic-element");
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
      const parent = testComponent();

      // Create the first child interactable with parent as scope
      const firstChild = firstChildComponent(() => parent.getElement());

      // Create the second child interactable with firstChild as scope
      const secondChild = secondChildComponent(() => firstChild.getElement());

      // Verify initial state
      parent.getElement().should("have.class", "parent-component");
      firstChild.getElement().should("have.class", "first-child");
      secondChild.getElement().should("have.class", "second-child");
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
      parent.getElement().should("have.class", "parent-component");
      firstChild.getElement().should("have.class", "first-child");

      // Verify we can still access the deepest content
      secondChild
        .getChildElement("DeepContent")
        .should("have.text", "Deeply Nested Content");

      // Perform interactions on the parent and verify children still work
      parent.click();
      firstChild.click();

      // Verify deepest child still works after parent interactions
      secondChild.getElement().should("exist");
      secondChild
        .getChildElement("DeepContent")
        .should("have.text", "Deeply Nested Content");
    });
  });
});
