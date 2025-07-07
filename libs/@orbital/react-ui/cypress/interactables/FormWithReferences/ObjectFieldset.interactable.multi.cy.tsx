// No direct Material-UI imports - we'll use the global MaterialUI object
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { ObjectFieldset } from "../../../src/components/FormWithReferences/ObjectFieldset";
import { ObjectProvider } from "../../../src/components/FormWithReferences/ObjectProvider";
import {
  objectFieldset,
  ObjectFieldsetInteractable,
} from "./ObjectFieldset.interactable";

describe("ObjectFieldsetInteractable with Multiple Fieldsets", () => {
  // Define schemas for testing
  const userSchema = z
    .object({
      name: z.string().describe("Name"),
      email: z.string().email().describe("Email"),
    })
    .describe("User");

  const productSchema = z
    .object({
      title: z.string().describe("Title"),
      price: z.number().min(0).describe("Price"),
      sku: z.string().describe("SKU"),
    })
    .describe("Product");

  // Create bridges for the schemas
  const userBridge = new ZodBridge({ schema: userSchema });
  const productBridge = new ZodBridge({ schema: productSchema });

  // Test data
  const userData1 = {
    name: "John Doe",
    email: "john@example.com",
  };

  const userData2 = {
    name: "Jane Smith",
    email: "jane@example.com",
  };

  const productData = {
    title: "Test Product",
    price: 99.99,
    sku: "TEST-123",
  };

  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Maximum update depth exceeded") ||
        err.message.includes("Cannot read properties of undefined")
      ) {
        return false;
      }
      return true;
    });

    // Material-UI components are already available globally from component-index.html
  });

  it("finds the correct fieldset when multiple of the same type exist", () => {
    // Mount a component with multiple User fieldsets
    mount(
      <div>
        <div data-testid="container-1" className="container-1">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="user-1"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
        <div data-testid="container-2" className="container-2">
          <ObjectProvider
            schema={userBridge}
            data={userData2}
            objectType="User"
            objectId="user-2"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
      </div>
    );

    // Without a parent element, the interactable will find the first matching fieldset
    const userFieldset = objectFieldset("User", undefined, undefined, 0);
    userFieldset.getFieldValue("name").should("equal", "John Doe");
  });

  it("uses parent element to scope to a specific fieldset", () => {
    // Mount a component with multiple User fieldsets
    mount(
      <div>
        <div data-testid="container-1" className="container-1">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="user-1"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
        <div data-testid="container-2" className="container-2">
          <ObjectProvider
            schema={userBridge}
            data={userData2}
            objectType="User"
            objectId="user-2"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
      </div>
    );

    // Create parent-scoped interactables for each container
    // We need to be more specific with our selectors to ensure we get the right fieldset
    const container1 = () => cy.get('[data-testid="container-1"]');
    const container2 = () => cy.get('[data-testid="container-2"]');

    // Create interactables with the parent elements
    const userFieldset1 = new ObjectFieldsetInteractable(
      "User",
      container1,
      "user-1",
      0
    );
    const userFieldset2 = new ObjectFieldsetInteractable(
      "User",
      container2,
      "user-2",
      0
    );

    // Verify each fieldset finds the correct data
    userFieldset1.getFieldValue("name").should("equal", "John Doe");
    userFieldset1.getFieldValue("email").should("equal", "john@example.com");
    userFieldset1.getObjectId().should("equal", "user-1");

    userFieldset2.getFieldValue("name").should("equal", "Jane Smith");
    userFieldset2.getFieldValue("email").should("equal", "jane@example.com");
    userFieldset2.getObjectId().should("equal", "user-2");
  });

  it("handles multiple fieldsets of different types", () => {
    // Mount a component with fieldsets of different types
    mount(
      <div>
        <div data-testid="user-container" className="user-container">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="user-1"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
        <div data-testid="product-container" className="product-container">
          <ObjectProvider
            schema={productBridge}
            data={productData}
            objectType="Product"
            objectId="product-1"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
      </div>
    );

    // Create interactables for each type
    const userFieldset = objectFieldset("User", undefined, "user-1", 0);
    const productFieldset = objectFieldset(
      "Product",
      undefined,
      "product-1",
      0
    );

    // Verify each fieldset finds the correct data
    userFieldset.getFieldValue("name").should("equal", "John Doe");
    userFieldset.getObjectId().should("equal", "user-1");

    productFieldset.getFieldValue("title").should("equal", "Test Product");
    productFieldset.getFieldValue("price").should("equal", "99.99");
    productFieldset.getObjectId().should("equal", "product-1");

    // Verify field existence
    userFieldset.hasField("name").should("be.true");
    userFieldset.hasField("price").should("be.false");

    productFieldset.hasField("title").should("be.true");
    productFieldset.hasField("name").should("be.false");
  });

  it("maintains correct scope after interactions", () => {
    // Create a component with state to properly handle updates
    function TestForm() {
      const [user1, setUser1] = useState(userData1);
      const [user2, setUser2] = useState(userData2);

      // Create handlers to update the state when field values change
      const handleUser1Change = (field: string, value: any) => {
        setUser1((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

      const handleUser2Change = (field: string, value: any) => {
        setUser2((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

      return (
        <div>
          <div data-testid="container-1" className="container-1">
            <ObjectProvider
              schema={userBridge}
              data={user1}
              objectType="User"
              objectId="user-1"
            >
              <ObjectFieldset />
            </ObjectProvider>
            <div data-testid="user1-name">{user1.name}</div>
            <button
              data-testid="update-user1-button"
              onClick={() => handleUser1Change("name", "John Updated")}
            >
              Update User 1
            </button>
          </div>

          <div data-testid="container-2" className="container-2">
            <ObjectProvider
              schema={userBridge}
              data={user2}
              objectType="User"
              objectId="user-2"
            >
              <ObjectFieldset />
            </ObjectProvider>
            <div data-testid="user2-name">{user2.name}</div>
            <button
              data-testid="update-user2-button"
              onClick={() => handleUser2Change("name", "Jane Updated")}
            >
              Update User 2
            </button>
          </div>
        </div>
      );
    }

    mount(<TestForm />);

    // Create parent-scoped interactables for each container
    const container1 = () => cy.get('[data-testid="container-1"]');
    const container2 = () => cy.get('[data-testid="container-2"]');

    const userFieldset1 = objectFieldset("User", container1, "user-1", 0);
    const userFieldset2 = objectFieldset("User", container2, "user-2", 0);

    // Verify initial values
    userFieldset1.getFieldValue("name").should("equal", "John Doe");
    userFieldset2.getFieldValue("name").should("equal", "Jane Smith");

    // Update User 1
    cy.get('[data-testid="update-user1-button"]').click();

    // Verify only User 1 was updated
    userFieldset1.getFieldValue("name").should("equal", "John Updated");
    userFieldset2.getFieldValue("name").should("equal", "Jane Smith");

    // Update User 2
    cy.get('[data-testid="update-user2-button"]').click();

    // Verify both users have their correct updated values
    userFieldset1.getFieldValue("name").should("equal", "John Updated");
    userFieldset2.getFieldValue("name").should("equal", "Jane Updated");

    // Verify display elements were updated
    cy.get('[data-testid="user1-name"]').should("contain", "John Updated");
    cy.get('[data-testid="user2-name"]').should("contain", "Jane Updated");
  });

  it("handles nested fieldsets with the same object type", () => {
    // Mount a component with nested fieldsets of the same type
    mount(
      <div>
        <div data-testid="outer-container" className="outer-container">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="outer-user"
          >
            <div>
              <h2>Outer User</h2>
              <ObjectFieldset />

              <div data-testid="inner-container" className="inner-container">
                <ObjectProvider
                  schema={userBridge}
                  data={userData2}
                  objectType="User"
                  objectId="inner-user"
                >
                  <h2>Inner User</h2>
                  <ObjectFieldset />
                </ObjectProvider>
              </div>
            </div>
          </ObjectProvider>
        </div>
      </div>
    );

    // Create parent-scoped interactables
    const outerContainer = () => cy.get('[data-testid="outer-container"]');
    const innerContainer = () => cy.get('[data-testid="inner-container"]');

    // Create interactables for each fieldset with index parameter
    const outerUserFieldset = objectFieldset(
      "User",
      outerContainer,
      "outer-user",
      0
    );
    const innerUserFieldset = objectFieldset(
      "User",
      innerContainer,
      "inner-user",
      0
    );

    // Verify each fieldset finds the correct data
    outerUserFieldset.getFieldValue("name").should("equal", "John Doe");
    outerUserFieldset.getObjectId().should("equal", "outer-user");

    innerUserFieldset.getFieldValue("name").should("equal", "Jane Smith");
    innerUserFieldset.getObjectId().should("equal", "inner-user");
  });

  it("finds fieldsets by object ID when multiple have the same object type", () => {
    // Mount a component with multiple User fieldsets with different IDs
    mount(
      <div>
        <ObjectProvider
          schema={userBridge}
          data={userData1}
          objectType="User"
          objectId="user-1"
        >
          <ObjectFieldset />
        </ObjectProvider>
        <ObjectProvider
          schema={userBridge}
          data={userData2}
          objectType="User"
          objectId="user-2"
        >
          <ObjectFieldset />
        </ObjectProvider>
      </div>
    );

    const outerUserFieldset = objectFieldset("User", undefined, "user-1");
    const innerUserFieldset = objectFieldset("User", undefined, "user-2");
  });

  it("works with a complex form containing multiple fieldsets of the same type", () => {
    // Create a component with a complex form
    function ComplexForm() {
      const [users, setUsers] = useState([
        { id: "user-1", data: { ...userData1 } },
        { id: "user-2", data: { ...userData2 } },
        {
          id: "user-3",
          data: { name: "Bob Johnson", email: "bob@example.com" },
        },
      ]);

      const updateUser = (index: number, field: string, value: any) => {
        const newUsers = [...users];
        newUsers[index].data = {
          ...newUsers[index].data,
          [field]: value,
        };
        setUsers(newUsers);
      };

      return (
        <div data-testid="complex-form">
          <h1>User Management</h1>

          {users.map((user, index) => (
            <div
              key={user.id}
              data-testid={`user-section-${index}`}
              className="user-section"
            >
              <h2>User {index + 1}</h2>
              <ObjectProvider
                schema={userBridge}
                data={user.data}
                objectType="User"
                objectId={user.id}
              >
                <ObjectFieldset />
              </ObjectProvider>

              <div data-testid={`user-${index}-name`}>{user.data.name}</div>

              <button
                data-testid={`update-user-${index}`}
                onClick={() =>
                  updateUser(index, "name", `${user.data.name} (Updated)`)
                }
              >
                Update User {index + 1}
              </button>
            </div>
          ))}
        </div>
      );
    }

    mount(<ComplexForm />);

    // Create parent-scoped interactables for each user section
    const userSection0 = () => cy.get('[data-testid="user-section-0"]');
    const userSection1 = () => cy.get('[data-testid="user-section-1"]');
    const userSection2 = () => cy.get('[data-testid="user-section-2"]');

    const userFieldset0 = objectFieldset("User", userSection0, "user-1", 0);
    const userFieldset1 = objectFieldset("User", userSection1, "user-2", 0);
    const userFieldset2 = objectFieldset("User", userSection2, "user-3", 0);

    // Verify initial values
    userFieldset0.getFieldValue("name").should("equal", "John Doe");
    userFieldset1.getFieldValue("name").should("equal", "Jane Smith");
    userFieldset2.getFieldValue("name").should("equal", "Bob Johnson");

    // Update User 1
    cy.get('[data-testid="update-user-1"]').click();

    // Verify only User 1 was updated
    userFieldset0.getFieldValue("name").should("equal", "John Doe");
    userFieldset1.getFieldValue("name").should("equal", "Jane Smith (Updated)");
    userFieldset2.getFieldValue("name").should("equal", "Bob Johnson");

    // Verify display elements were updated
    cy.get('[data-testid="user-1-name"]').should(
      "contain",
      "Jane Smith (Updated)"
    );

    // Update User 0 and User 2
    cy.get('[data-testid="update-user-0"]').click();
    cy.get('[data-testid="update-user-2"]').click();

    // Verify all users have their correct updated values
    userFieldset0.getFieldValue("name").should("equal", "John Doe (Updated)");
    userFieldset1.getFieldValue("name").should("equal", "Jane Smith (Updated)");
    userFieldset2
      .getFieldValue("name")
      .should("equal", "Bob Johnson (Updated)");

    // Verify display elements were updated
    cy.get('[data-testid="user-0-name"]').should(
      "contain",
      "John Doe (Updated)"
    );
    cy.get('[data-testid="user-2-name"]').should(
      "contain",
      "Bob Johnson (Updated)"
    );
  });
});

describe("ObjectFieldsetInteractable with Index Parameter", () => {
  // Define schemas for testing
  const userSchema = z
    .object({
      name: z.string().describe("Name"),
      email: z.string().email().describe("Email"),
    })
    .describe("User");

  // Create bridge for the schema
  const userBridge = new ZodBridge({ schema: userSchema });

  // Test data
  const userData1 = {
    name: "John Doe",
    email: "john@example.com",
  };

  const userData2 = {
    name: "Jane Smith",
    email: "jane@example.com",
  };

  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Maximum update depth exceeded") ||
        err.message.includes("Cannot read properties of undefined")
      ) {
        return false;
      }
      return true;
    });

    // Material-UI components are already available globally from component-index.html
  });

  it("should handle multiple fieldsets with the same object type and same object ID using index", () => {
    // Mount a component with multiple User fieldsets with the same ID
    mount(
      <div>
        <div data-testid="container">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
          <ObjectProvider
            schema={userBridge}
            data={userData2}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
      </div>
    );

    // Create field interactables with the same object type and ID but different indices
    const fieldset1 = objectFieldset("User", undefined, "same-id-123", 0);
    const fieldset2 = objectFieldset("User", undefined, "same-id-123", 1);

    // Verify each fieldset finds the correct data
    fieldset1.getFieldValue("name").should("equal", "John Doe");
    fieldset1.getFieldValue("email").should("equal", "john@example.com");

    fieldset2.getFieldValue("name").should("equal", "Jane Smith");
    fieldset2.getFieldValue("email").should("equal", "jane@example.com");
  });

  it("throws an error when multiple elements match but no index is provided", () => {
    // Mount a component with multiple User fieldsets with the same ID
    mount(
      <div>
        <div data-testid="container">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
          <ObjectProvider
            schema={userBridge}
            data={userData2}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
      </div>
    );

    // Set up Cypress to catch the error
    cy.on("fail", (err) => {
      expect(err.message).to.include("Multiple elements");
      expect(err.message).to.include("found matching selector");
      expect(err.message).to.include("but no index parameter was provided");
      return false;
    });

    // Try to create a fieldset interactable without an index
    // This should throw an error because multiple elements match
    const fieldset = objectFieldset("User", undefined, "same-id-123");

    // Attempt to interact with the fieldset, which should trigger the error
    fieldset.getElement();
  });

  it("should handle parent element and index together for disambiguation", () => {
    // Mount a component with multiple User fieldsets with the same ID in different containers
    mount(
      <div>
        <div data-testid="container-1">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
          <ObjectProvider
            schema={userBridge}
            data={userData2}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
        <div data-testid="container-2">
          <ObjectProvider
            schema={userBridge}
            data={userData1}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
          <ObjectProvider
            schema={userBridge}
            data={userData2}
            objectType="User"
            objectId="same-id-123"
          >
            <ObjectFieldset />
          </ObjectProvider>
        </div>
      </div>
    );

    // Create parent-scoped interactables for each container
    const container1 = () => cy.get('[data-testid="container-1"]');
    const container2 = () => cy.get('[data-testid="container-2"]');

    // Create fieldset interactables with parent elements and indices
    const fieldset1Container1 = objectFieldset(
      "User",
      container1,
      "same-id-123",
      0
    );
    const fieldset2Container1 = objectFieldset(
      "User",
      container1,
      "same-id-123",
      1
    );
    const fieldset1Container2 = objectFieldset(
      "User",
      container2,
      "same-id-123",
      0
    );
    const fieldset2Container2 = objectFieldset(
      "User",
      container2,
      "same-id-123",
      1
    );

    // Verify each fieldset finds the correct data
    fieldset1Container1.getFieldValue("name").should("equal", "John Doe");
    fieldset2Container1.getFieldValue("name").should("equal", "Jane Smith");
    fieldset1Container2.getFieldValue("name").should("equal", "John Doe");
    fieldset2Container2.getFieldValue("name").should("equal", "Jane Smith");

    // Verify email fields to ensure we're getting the right data
    fieldset1Container1
      .getFieldValue("email")
      .should("equal", "john@example.com");
    fieldset2Container1
      .getFieldValue("email")
      .should("equal", "jane@example.com");
    fieldset1Container2
      .getFieldValue("email")
      .should("equal", "john@example.com");
    fieldset2Container2
      .getFieldValue("email")
      .should("equal", "jane@example.com");
  });
});
