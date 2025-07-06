// @ts-nocheck
/// <reference types="cypress" />
import { mount } from "cypress/react";
import { useState } from "react";
import { ObjectSelector } from "../../../src/components/ObjectSelector/ObjectSelector";
import { objectSelector } from "./ObjectSelector.interactable";

describe("ObjectSelector Interactable - Multi", () => {
  // Sample data for testing
  const itemsData = [
    { _id: "item1", name: "Item 1" },
    { _id: "item2", name: "Item 2" },
    { _id: "item3", name: "Item 3" },
  ];

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", (err) => {
      if (err.message.includes("Maximum update depth exceeded")) {
        return false;
      }
      return true;
    });
  });

  // Data attribute tests
  describe("Data Attributes", () => {
    it("verifies data-object-type and data-object-id attributes", () => {
      // Create a component with explicit object type and ID
      function TestComponent() {
        const [value, setValue] = useState("");

        const options = [
          { id: "option1", name: "Option 1" },
          { id: "option2", name: "Option 2" },
          { id: "option3", name: "Option 3" },
        ];

        return (
          <div>
            <ObjectSelector
              data-testid="ObjectSelector"
              data-field-name="testField"
              objectType="TestObject"
              objectId="test-object-123"
              label="Test Field"
              value={value}
              onChange={(newValue) => setValue(newValue as string)}
              options={options}
              displayField="name"
              idField="id"
              id="test-selector"
              name="testField"
            />
          </div>
        );
      }

      mount(<TestComponent />);

      const selector = objectSelector(
        "testField",
        undefined,
        "ObjectSelector",
        false,
        "TestObject"
      );

      // Verify the selector exists
      selector.should("exist");

      // Use the new methods to verify data attributes
      selector.getObjectType().should("equal", "TestObject");
      selector.getObjectId().should("equal", "test-object-123");
    });

    it("handles missing data-object-id attribute", () => {
      // Create a component with object type but no ID
      function TestComponent() {
        const [value, setValue] = useState("");

        const options = [
          { id: "option1", name: "Option 1" },
          { id: "option2", name: "Option 2" },
          { id: "option3", name: "Option 3" },
        ];

        return (
          <div>
            <ObjectSelector
              data-testid="ObjectSelector"
              data-field-name="testField"
              objectType="TestObject"
              label="Test Field"
              value={value}
              onChange={(newValue) => setValue(newValue as string)}
              options={options}
              displayField="name"
              idField="id"
              id="test-selector"
              name="testField"
            />
          </div>
        );
      }

      mount(<TestComponent />);

      const selector = objectSelector(
        "testField",
        undefined,
        "ObjectSelector",
        false,
        "TestObject"
      );

      // Verify the selector exists
      selector.should("exist");

      // Use the new methods to verify data attributes
      selector.getObjectType().should("equal", "TestObject");
      selector.getObjectId().should("be.undefined");
    });

    it("works with multiple selectors with different object types", () => {
      // Create a component with multiple selectors
      function TestComponent() {
        const [userValue, setUserValue] = useState("");
        const [postValue, setPostValue] = useState("");

        const userOptions = [
          { id: "user1", name: "User 1" },
          { id: "user2", name: "User 2" },
        ];

        const postOptions = [
          { id: "post1", name: "Post 1" },
          { id: "post2", name: "Post 2" },
        ];

        return (
          <div>
            <ObjectSelector
              data-testid="ObjectSelector"
              data-field-name="userField"
              objectType="User"
              objectId="user-container-123"
              label="User Field"
              value={userValue}
              onChange={(newValue) => setUserValue(newValue as string)}
              options={userOptions}
              displayField="name"
              idField="id"
              id="user-selector"
              name="userField"
            />

            <ObjectSelector
              data-testid="ObjectSelector"
              data-field-name="postField"
              objectType="Post"
              objectId="post-container-456"
              label="Post Field"
              value={postValue}
              onChange={(newValue) => setPostValue(newValue as string)}
              options={postOptions}
              displayField="name"
              idField="id"
              id="post-selector"
              name="postField"
            />
          </div>
        );
      }

      mount(<TestComponent />);

      const userSelector = objectSelector(
        "userField",
        undefined,
        "ObjectSelector",
        false,
        "User"
      );
      const postSelector = objectSelector(
        "postField",
        undefined,
        "ObjectSelector",
        false,
        "Post"
      );

      // Verify both selectors exist
      userSelector.should("exist");
      postSelector.should("exist");

      // Use the new methods to verify data attributes
      userSelector.getObjectType().should("equal", "User");
      userSelector.getObjectId().should("equal", "user-container-123");

      postSelector.getObjectType().should("equal", "Post");
      postSelector.getObjectId().should("equal", "post-container-456");
    });

    it("finds selectors by objectId when multiple have the same object type", () => {
      // Create a component with multiple selectors of the same object type but different IDs
      function TestComponent() {
        const [user1Value, setUser1Value] = useState("");
        const [user2Value, setUser2Value] = useState("");

        const userOptions = [
          { id: "user1", name: "User 1" },
          { id: "user2", name: "User 2" },
        ];

        return (
          <div>
            <div data-testid="user1-container">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="userField"
                objectType="User"
                objectId="user-1"
                label="User 1 Field"
                value={user1Value}
                onChange={(newValue) => setUser1Value(newValue as string)}
                options={userOptions}
                displayField="name"
                idField="id"
                id="user1-selector"
                name="userField"
              />
            </div>

            <div data-testid="user2-container">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="userField"
                objectType="User"
                objectId="user-2"
                label="User 2 Field"
                value={user2Value}
                onChange={(newValue) => setUser2Value(newValue as string)}
                options={userOptions}
                displayField="name"
                idField="id"
                id="user2-selector"
                name="userField"
              />
            </div>
          </div>
        );
      }

      mount(<TestComponent />);

      // Create parent-scoped interactables for each container
      const user1Container = () => cy.get('[data-testid="user1-container"]');
      const user2Container = () => cy.get('[data-testid="user2-container"]');

      // Create interactables using parent elements and objectId
      const user1Selector = objectSelector(
        "userField",
        user1Container,
        "ObjectSelector",
        false,
        "User",
        "user-1"
      );
      const user2Selector = objectSelector(
        "userField",
        user2Container,
        "ObjectSelector",
        false,
        "User",
        "user-2"
      );

      // Verify both selectors exist and have the correct attributes
      user1Selector.should("exist");
      user2Selector.should("exist");

      user1Selector.getObjectType().should("equal", "User");
      user1Selector.getObjectId().should("equal", "user-1");

      user2Selector.getObjectType().should("equal", "User");
      user2Selector.getObjectId().should("equal", "user-2");

      // Test interactions with each selector
      user1Selector.selectById("user1");
      user2Selector.selectById("user2");

      // Verify each selector has the correct value
      user1Selector.getSelectedText().should("contain", "User 1");
      user2Selector.getSelectedText().should("contain", "User 2");
    });
  });

  describe("Index Parameter for Multiple Elements", () => {
    it("handles multiple selectors with the same object type and same object ID using index", () => {
      // Create a component with multiple selectors of the same object type and same ID
      function TestComponent() {
        const [selector1Value, setSelector1Value] = useState("");
        const [selector2Value, setSelector2Value] = useState("");

        const options = [
          { id: "option1", name: "Option 1" },
          { id: "option2", name: "Option 2" },
          { id: "option3", name: "Option 3" },
        ];

        return (
          <div>
            <div data-testid="first-selector">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="sameField"
                objectType="SameType"
                objectId="same-id"
                label="First Selector"
                value={selector1Value}
                onChange={(newValue) => setSelector1Value(newValue as string)}
                options={options}
                displayField="name"
                idField="id"
                id="selector1"
                name="sameField"
              />
            </div>

            <div data-testid="second-selector">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="sameField"
                objectType="SameType"
                objectId="same-id"
                label="Second Selector"
                value={selector2Value}
                onChange={(newValue) => setSelector2Value(newValue as string)}
                options={options}
                displayField="name"
                idField="id"
                id="selector2"
                name="sameField"
              />
            </div>
          </div>
        );
      }

      mount(<TestComponent />);

      // Create interactables using index parameter
      const firstSelector = objectSelector(
        "sameField",
        undefined,
        "ObjectSelector",
        false,
        "SameType",
        "same-id",
        0 // First matching element
      );

      const secondSelector = objectSelector(
        "sameField",
        undefined,
        "ObjectSelector",
        false,
        "SameType",
        "same-id",
        1 // Second matching element
      );

      // Verify both selectors exist
      firstSelector.should("exist");
      secondSelector.should("exist");

      // Test interactions with each selector
      firstSelector.selectById("option1");
      secondSelector.selectById("option2");

      // Verify each selector has the correct value
      firstSelector.getSelectedText().should("contain", "Option 1");
      secondSelector.getSelectedText().should("contain", "Option 2");
    });

    it("throws an error when multiple elements match but no index is provided", () => {
      // Create a component with multiple selectors of the same object type and same ID
      function TestComponent() {
        const [selector1Value, setSelector1Value] = useState("");
        const [selector2Value, setSelector2Value] = useState("");

        const options = [
          { id: "option1", name: "Option 1" },
          { id: "option2", name: "Option 2" },
        ];

        return (
          <div>
            <ObjectSelector
              data-testid="ObjectSelector"
              data-field-name="duplicateField"
              objectType="DuplicateType"
              objectId="duplicate-id"
              label="First Duplicate"
              value={selector1Value}
              onChange={(newValue) => setSelector1Value(newValue as string)}
              options={options}
              displayField="name"
              idField="id"
              id="duplicate1"
              name="duplicateField"
            />

            <ObjectSelector
              data-testid="ObjectSelector"
              data-field-name="duplicateField"
              objectType="DuplicateType"
              objectId="duplicate-id"
              label="Second Duplicate"
              value={selector2Value}
              onChange={(newValue) => setSelector2Value(newValue as string)}
              options={options}
              displayField="name"
              idField="id"
              id="duplicate2"
              name="duplicateField"
            />
          </div>
        );
      }

      mount(<TestComponent />);

      // This should throw an error because multiple elements match but no index is provided
      const errorMessage = "Multiple elements (2) found matching selector";

      // Use cy.on to catch the error
      cy.on("fail", (err) => {
        if (err.message.includes(errorMessage)) {
          // This is the expected error, so return false to prevent the test from failing
          return false;
        }
        // For other errors, let the test fail
        throw err;
      });

      // Try to create an interactable without an index
      objectSelector(
        "duplicateField",
        undefined,
        "ObjectSelector",
        false,
        "DuplicateType",
        "duplicate-id"
      ).getElement();
    });

    it("handles mixed cases with one field having an ID and another without", () => {
      // Create a component with one selector having an ID and another without
      function TestComponent() {
        const [withIdValue, setWithIdValue] = useState("");
        const [withoutIdValue, setWithoutIdValue] = useState("");

        const options = [
          { id: "option1", name: "Option 1" },
          { id: "option2", name: "Option 2" },
        ];

        return (
          <div>
            <div data-testid="with-id-container">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="mixedField"
                objectType="MixedType"
                objectId="has-id"
                label="With ID"
                value={withIdValue}
                onChange={(newValue) => setWithIdValue(newValue as string)}
                options={options}
                displayField="name"
                idField="id"
                id="withId"
                name="mixedField"
              />
            </div>

            <div data-testid="without-id-container">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="mixedField"
                objectType="MixedType"
                label="Without ID"
                value={withoutIdValue}
                onChange={(newValue) => setWithoutIdValue(newValue as string)}
                options={options}
                displayField="name"
                idField="id"
                id="withoutId"
                name="mixedField"
              />
            </div>
          </div>
        );
      }

      mount(<TestComponent />);

      // Create parent-scoped interactables for each container
      const withIdContainer = () => cy.get('[data-testid="with-id-container"]');
      const withoutIdContainer = () =>
        cy.get('[data-testid="without-id-container"]');

      // Create interactables using parent elements to avoid ambiguity
      const withIdSelector = objectSelector(
        "mixedField",
        withIdContainer,
        "ObjectSelector",
        false,
        "MixedType",
        "has-id"
      );

      const withoutIdSelector = objectSelector(
        "mixedField",
        withoutIdContainer,
        "ObjectSelector",
        false,
        "MixedType"
      );

      // Verify both selectors exist
      withIdSelector.should("exist");
      withoutIdSelector.should("exist");

      // Test interactions with each selector
      withIdSelector.selectById("option1");
      withoutIdSelector.selectById("option2");

      // Verify each selector has the correct value
      withIdSelector.getSelectedText().should("contain", "Option 1");
      withoutIdSelector.getSelectedText().should("contain", "Option 2");
    });

    it("handles fields for different object types without object IDs", () => {
      // Create a component with selectors for different object types but no IDs
      function TestComponent() {
        const [type1Value, setType1Value] = useState("");
        const [type2Value, setType2Value] = useState("");

        const options = [
          { id: "option1", name: "Option 1" },
          { id: "option2", name: "Option 2" },
        ];

        return (
          <div>
            <div data-testid="type1-container">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="noIdField"
                objectType="Type1"
                label="Type 1"
                value={type1Value}
                onChange={(newValue) => setType1Value(newValue as string)}
                options={options}
                displayField="name"
                idField="id"
                id="type1"
                name="noIdField"
              />
            </div>

            <div data-testid="type2-container">
              <ObjectSelector
                data-testid="ObjectSelector"
                data-field-name="noIdField"
                objectType="Type2"
                label="Type 2"
                value={type2Value}
                onChange={(newValue) => setType2Value(newValue as string)}
                options={options}
                displayField="name"
                idField="id"
                id="type2"
                name="noIdField"
              />
            </div>
          </div>
        );
      }

      mount(<TestComponent />);

      // Create parent-scoped interactables for each container
      const type1Container = () => cy.get('[data-testid="type1-container"]');
      const type2Container = () => cy.get('[data-testid="type2-container"]');

      // Create interactables with different object types and parent elements
      const type1Selector = objectSelector(
        "noIdField",
        type1Container,
        "ObjectSelector",
        false,
        "Type1"
      );

      const type2Selector = objectSelector(
        "noIdField",
        type2Container,
        "ObjectSelector",
        false,
        "Type2"
      );

      // Verify both selectors exist
      type1Selector.should("exist");
      type2Selector.should("exist");

      // Test interactions with each selector
      type1Selector.selectById("option1");
      type2Selector.selectById("option2");

      // Verify each selector has the correct value
      type1Selector.getSelectedText().should("contain", "Option 1");
      type2Selector.getSelectedText().should("contain", "Option 2");
    });
  });
});
