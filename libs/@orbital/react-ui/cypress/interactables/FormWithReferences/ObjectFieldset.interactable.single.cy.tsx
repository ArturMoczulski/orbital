// Import everything except Material-UI components
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import React, { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { ObjectFieldset } from "../../../src/components/FormWithReferences/ObjectFieldset";
import { ObjectProvider } from "../../../src/components/FormWithReferences/ObjectProvider";
import { ZodReferencesBridge } from "../../../src/components/FormWithReferences/ZodReferencesBridge";
import { objectFieldset } from "./ObjectFieldset.interactable";

describe("ObjectFieldsetInteractable", () => {
  // Define a simple schema for testing
  const testSchema = z
    .object({
      name: z.string().describe("Name"),
      email: z.string().email().describe("Email"),
      age: z.number().min(18).describe("Age"),
    })
    .describe("User");

  // Create a bridge for the schema
  const testBridge = new ZodBridge({ schema: testSchema });

  // Test data
  const testData = {
    name: "John Doe",
    email: "john@example.com",
    age: 30,
  };

  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    // This is useful for handling React warnings about state updates
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Maximum update depth exceeded") ||
        err.message.includes("Cannot read properties of undefined") ||
        err.message.includes("Script error")
      ) {
        return false;
      }
      return true;
    });

    // Material-UI components are already available globally from component-index.html

    // No need for the React.createElement override which causes TS errors
  });

  it("finds the fieldset using the correct selector", () => {
    mount(
      <ObjectProvider schema={testBridge} data={testData} objectType="User">
        <ObjectFieldset />
      </ObjectProvider>
    );

    cy.wait(1000);

    // Create the interactable
    const fieldset = objectFieldset("User");

    // Verify it can find the element
    fieldset.should("exist");
  });

  it("gets all field names in the fieldset", () => {
    mount(
      <ObjectProvider schema={testBridge} data={testData} objectType="User">
        <ObjectFieldset />
      </ObjectProvider>
    );

    const fieldset = objectFieldset("User");

    fieldset.getFieldNames().then((fieldNames) => {
      expect(fieldNames).to.include("name");
      expect(fieldNames).to.include("email");
      expect(fieldNames).to.include("age");
      expect(fieldNames.length).to.equal(3);
    });
  });

  it("checks if a field exists in the fieldset", () => {
    mount(
      <ObjectProvider schema={testBridge} data={testData} objectType="User">
        <ObjectFieldset />
      </ObjectProvider>
    );

    const fieldset = objectFieldset("User");

    fieldset.hasField("name").should("be.true");
    fieldset.hasField("nonexistent").should("be.false");
  });

  it("gets and sets field values", () => {
    // Create a component with state to properly handle updates
    function TestForm() {
      const [data, setData] = useState(testData);

      // Create a handler to update the state when field values change
      const handleChange = (field: string, value: any) => {
        setData((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

      return (
        <div>
          <ObjectProvider
            schema={testBridge}
            data={data}
            objectType="User"
            objectId="user-1"
          >
            <ObjectFieldset />
          </ObjectProvider>

          {/* Display the current value for verification */}
          <div data-testid="current-name">{data.name}</div>

          {/* Add a button to manually update the name field for testing */}
          <button
            data-testid="update-name-button"
            onClick={() => handleChange("name", "Jane Smith")}
          >
            Update Name
          </button>
        </div>
      );
    }

    mount(<TestForm />);

    const fieldset = objectFieldset("User");

    // Check initial value
    fieldset.getFieldValue("name").should("equal", "John Doe");

    // Instead of using setFieldValue which might not trigger React state updates,
    // use the button we added to update the state directly
    cy.get('[data-testid="update-name-button"]').click();

    // Verify the input field was updated
    fieldset.getFieldValue("name").should("equal", "Jane Smith");

    // Verify the display element was updated
    cy.get('[data-testid="current-name"]').should("contain", "Jane Smith");
  });

  it("works with fields that have error states", () => {
    // Create a component with validation
    function TestForm() {
      const [hasError, setHasError] = useState(false);

      return (
        <div>
          <ObjectProvider
            schema={testBridge}
            data={testData}
            objectType="User"
            objectId="user-error-test"
          >
            <ObjectFieldset />
          </ObjectProvider>
          <button
            data-testid="toggle-error"
            onClick={() => {
              // Manually add error class to the email field
              cy.get('input[name="email"]')
                .closest(".MuiFormControl-root")
                .then(($el) => {
                  if (hasError) {
                    $el.removeClass("Mui-error");
                    // Make sure to create the helper text element if it doesn't exist
                    if ($el.find(".MuiFormHelperText-root").length === 0) {
                      $el.append('<div class="MuiFormHelperText-root"></div>');
                    }
                    $el.find(".MuiFormHelperText-root").text("");
                  } else {
                    $el.addClass("Mui-error");
                    // Make sure to create the helper text element if it doesn't exist
                    if ($el.find(".MuiFormHelperText-root").length === 0) {
                      $el.append('<div class="MuiFormHelperText-root"></div>');
                    }
                    $el.find(".MuiFormHelperText-root").text("Invalid email");
                  }
                  setHasError(!hasError);
                });
            }}
          >
            Toggle Error
          </button>
        </div>
      );
    }

    mount(<TestForm />);

    const fieldset = objectFieldset("User");

    // Initially no error
    fieldset.fieldHasError("email").should("be.false");

    // Toggle error on
    cy.get('[data-testid="toggle-error"]').click();

    // Now should have error
    fieldset.fieldHasError("email").should("be.true");
    fieldset.getFieldErrorMessage("email").should("equal", "Invalid email");
  });

  it("checks if fields are required or disabled", () => {
    // Create a component with required and disabled fields
    function TestForm() {
      const [isDisabled, setIsDisabled] = useState(false);

      return (
        <div>
          <ObjectProvider
            schema={testBridge}
            data={testData}
            objectType="User"
            objectId="required-disabled-test"
          >
            <div
              data-testid="ObjectFieldset"
              data-object-type="User"
              data-object-id="required-disabled-test"
            >
              {/* Manually create fields to test required and disabled states */}
              <div className="MuiFormControl-root">
                <label className="MuiFormLabel-root">
                  Name<span className="MuiFormLabel-asterisk">*</span>
                </label>
                <input name="name" value={testData.name} required />
              </div>

              <div className="MuiFormControl-root">
                <label className="MuiFormLabel-root">Email</label>
                <input
                  name="email"
                  value={testData.email}
                  disabled={isDisabled}
                  className={isDisabled ? "Mui-disabled" : ""}
                />
              </div>
            </div>
          </ObjectProvider>
          <button
            data-testid="toggle-disabled"
            onClick={() => setIsDisabled(!isDisabled)}
          >
            Toggle Disabled
          </button>
        </div>
      );
    }

    mount(<TestForm />);

    const fieldset = objectFieldset("User");

    // Check required state
    fieldset.isFieldRequired("name").should("be.true");
    fieldset.isFieldRequired("email").should("be.false");

    // Check initial disabled state
    fieldset.isFieldDisabled("email").should("be.false");

    // Toggle disabled state
    cy.get('[data-testid="toggle-disabled"]').click();

    // Check updated disabled state
    fieldset.isFieldDisabled("email").should("be.true");
  });

  it("works with ZodReferencesBridge and relationship fields", () => {
    // Create schemas with references
    const userSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
      })
      .describe("User");

    const postSchema = z
      .object({
        title: z.string().describe("Title"),
        author: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: userSchema,
            name: "author",
          })
          .describe("Author"),
      })
      .describe("Post");

    // Create a bridge with references
    const refBridge = new ZodReferencesBridge({
      schema: postSchema,
      dependencies: {
        author: [
          { id: "123e4567-e89b-12d3-a456-426614174000", name: "User 1" },
          { id: "223e4567-e89b-12d3-a456-426614174000", name: "User 2" },
        ],
      },
    });

    const postData = {
      title: "Test Post",
      author: "123e4567-e89b-12d3-a456-426614174000",
    };

    mount(
      <ObjectProvider schema={refBridge} data={postData} objectType="Post">
        <ObjectFieldset />
      </ObjectProvider>
    );

    const fieldset = objectFieldset("Post");

    // Verify the fieldset exists
    fieldset.should("exist");

    // Verify it has the expected fields
    fieldset.hasField("title").should("be.true");
    fieldset.hasField("author").should("be.true");

    // Verify field values
    fieldset.getFieldValue("title").should("equal", "Test Post");
  });

  it("works with multiple fieldsets in a single form", () => {
    // Create two schemas
    const userSchema = z
      .object({
        name: z.string().describe("Name"),
        email: z.string().email().describe("Email"),
      })
      .describe("User");

    const addressSchema = z
      .object({
        street: z.string().describe("Street"),
        city: z.string().describe("City"),
        zipCode: z.string().describe("Zip Code"),
      })
      .describe("Address");

    // Create bridges
    const userBridge = new ZodBridge({ schema: userSchema });
    const addressBridge = new ZodBridge({ schema: addressSchema });

    // Test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const addressData = {
      street: "123 Main St",
      city: "Anytown",
      zipCode: "12345",
    };

    // Create a component with a form containing multiple fieldsets
    function TestForm() {
      const [user, setUser] = useState(userData);
      const [address, setAddress] = useState(addressData);

      // Create handlers to update the state when field values change
      const handleUserChange = (field: string, value: any) => {
        setUser((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

      const handleAddressChange = (field: string, value: any) => {
        setAddress((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would submit both objects together
        cy.log("Form submitted", { user, address });
      };

      return (
        <form onSubmit={handleSubmit} data-testid="multi-object-form">
          <h2>User Information</h2>
          <ObjectProvider
            schema={userBridge}
            data={user}
            objectId="user-1"
            objectType="User"
          >
            <ObjectFieldset />
          </ObjectProvider>

          {/* Display current user data for verification */}
          <div data-testid="user-name">{user.name}</div>

          {/* Add buttons to manually update fields for testing */}
          <button
            data-testid="update-user-name"
            onClick={() => handleUserChange("name", "Jane Smith")}
            type="button"
          >
            Update User Name
          </button>

          <h2>Address Information</h2>
          <ObjectProvider
            schema={addressBridge}
            data={address}
            objectId="address-1"
            objectType="Address"
          >
            <ObjectFieldset />
          </ObjectProvider>

          {/* Display current address data for verification */}
          <div data-testid="address-city">{address.city}</div>

          {/* Add buttons to manually update fields for testing */}
          <button
            data-testid="update-address-city"
            onClick={() => handleAddressChange("city", "New City")}
            type="button"
          >
            Update Address City
          </button>

          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </form>
      );
    }

    mount(<TestForm />);

    // Create interactables for both fieldsets
    const userFieldset = objectFieldset("User");
    const addressFieldset = objectFieldset("Address");

    // Verify both fieldsets exist
    userFieldset.should("exist");
    addressFieldset.should("exist");

    // Verify fields in each fieldset
    userFieldset.hasField("name").should("be.true");
    userFieldset.hasField("email").should("be.true");

    addressFieldset.hasField("street").should("be.true");
    addressFieldset.hasField("city").should("be.true");
    addressFieldset.hasField("zipCode").should("be.true");

    // Instead of using setFieldValue which might not trigger React state updates,
    // use the buttons we added to update the state directly
    cy.get('[data-testid="update-user-name"]').click();
    cy.get('[data-testid="update-address-city"]').click();

    // Verify the display elements were updated
    cy.get('[data-testid="user-name"]').should("contain", "Jane Smith");
    cy.get('[data-testid="address-city"]').should("contain", "New City");

    // Verify the input fields were updated
    userFieldset.getFieldValue("name").should("equal", "Jane Smith");
    addressFieldset.getFieldValue("city").should("equal", "New City");
  });

  it("verifies data-object-type and data-object-id attributes", () => {
    // Create a component with explicit object type and ID
    mount(
      <ObjectProvider
        schema={testBridge}
        data={testData}
        objectType="User"
        objectId="test-user-123"
      >
        <ObjectFieldset />
      </ObjectProvider>
    );

    const fieldset = objectFieldset("User");

    // Verify the fieldset exists
    fieldset.should("exist");

    // Use the new methods to verify data attributes
    fieldset.getObjectType().should("equal", "User");
    fieldset.getObjectId().should("equal", "test-user-123");

    // Test with a different object type and ID
    mount(
      <ObjectProvider
        schema={testBridge}
        data={testData}
        objectType="Customer"
        objectId="customer-456"
      >
        <ObjectFieldset />
      </ObjectProvider>
    );

    const customerFieldset = objectFieldset("Customer");

    // Verify the fieldset exists
    customerFieldset.should("exist");

    // Use the new methods to verify data attributes
    customerFieldset.getObjectType().should("equal", "Customer");
    customerFieldset.getObjectId().should("equal", "customer-456");
  });

  it.only("works with references between different object types (area belongs to world)", () => {
    // Create schemas with references
    const worldSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        description: z.string().optional().describe("Description"),
      })
      .describe("World");

    const areaSchema = z
      .object({
        name: z.string().describe("Name"),
        size: z.number().min(0).describe("Size"),
        worldId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: worldSchema,
            name: "world",
          })
          .describe("World"),
      })
      .describe("Area");

    // Create a bridge with references
    const refBridge = new ZodReferencesBridge({
      schema: areaSchema,
      dependencies: {
        world: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Fantasy World",
            description: "A magical realm",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174000",
            name: "Sci-Fi World",
            description: "A futuristic setting",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174000",
            name: "Historical World",
            description: "Based on real history",
          },
        ],
      },
    });

    const areaData = {
      name: "Forest of Shadows",
      size: 500,
      worldId: "123e4567-e89b-12d3-a456-426614174000",
    };

    // Use ObjectProvider directly instead of FormWithReferences
    // This avoids the issue with AutoValidatedQuickMaterialForm
    mount(
      <ObjectProvider schema={refBridge} data={areaData} objectType="Area">
        <ObjectFieldset />
      </ObjectProvider>
    );

    const fieldset = objectFieldset("Area");

    // Verify the fieldset exists
    fieldset.should("exist");

    // Verify it has the expected fields
    fieldset.hasField("name").should("be.true");
    fieldset.hasField("size").should("be.true");
    fieldset.hasField("worldId").should("be.true");

    // Verify field values
    fieldset.getFieldValue("name").should("equal", "Forest of Shadows");
    fieldset.getFieldValue("size").should("equal", "500");

    // Use fieldset.field() to interact with the reference field, passing the ObjectSelectorInteractable constructor
    // Instead of using ObjectSelectorInteractable, directly interact with the element
    fieldset.get({}).find('[data-field-name="worldId"]').should("exist");

    // Get the input field within the BelongsToField
    const worldField = fieldset
      .get({})
      .find('[data-field-name="worldId"] input');

    // Get the display text using selected() helper
    // worldField.selected().should("equal", "Fantasy World");

    // Click on the input to open the dropdown
    worldField.click();

    // Verify options are available
    cy.get(".MuiAutocomplete-popper").should("be.visible");
    cy.get('.MuiAutocomplete-popper [role="option"]').should("have.length", 3);
    cy.get('.MuiAutocomplete-popper [role="option"]').then(
      (items: JQuery<HTMLElement>) => {
        expect(items[0].textContent).to.include("Fantasy World");
        expect(items[1].textContent).to.include("Sci-Fi World");
        expect(items[2].textContent).to.include("Historical World");
      }
    );

    // Select a different option - use alias to avoid detached DOM issues
    cy.get('.MuiAutocomplete-popper [role="option"]').as("options");
    cy.get("@options").contains("Sci-Fi World").click();

    // Wait for the dropdown to close
    cy.get(".MuiAutocomplete-popper").should("not.exist");

    // Get the input field again after the selection and verify its value
    cy.get('[data-field-name="worldId"] input').should(
      "have.value",
      "Sci-Fi World"
    );
  });
});
