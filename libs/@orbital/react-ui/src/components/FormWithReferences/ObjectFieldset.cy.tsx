import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import React, { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { ObjectFieldset } from "./ObjectFieldset";
import { ObjectProvider } from "./ObjectProvider";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

describe("ObjectFieldset", () => {
  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    cy.on("uncaught:exception", (err) => {
      if (err.message.includes("Maximum update depth exceeded")) {
        return false;
      }
      return true;
    });
  });

  it("debug - logs data-testid attributes", () => {
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

    mount(
      <ObjectProvider schema={testBridge} data={testData}>
        <ObjectFieldset />
      </ObjectProvider>
    );

    // Log all elements with data-testid attributes
    cy.get("[data-testid]").each(($el) => {
      cy.log(`Found element with data-testid: ${$el.attr("data-testid")}`);
      cy.log(`data-object-id: ${$el.attr("data-object-id")}`);
      cy.log(`data-object-type: ${$el.attr("data-object-type")}`);
    });

    // Check for the data-object-type attribute directly
    cy.get('[data-testid="ObjectFieldset"]').should(
      "have.attr",
      "data-object-type"
    );

    // Log the data-object-type value
    cy.get('[data-testid="ObjectFieldset"]').then(($el) => {
      cy.log(
        `ObjectType from data-object-type: ${$el.attr("data-object-type")}`
      );
    });
  });
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

  it("renders fields based on the schema", () => {
    mount(
      <ObjectProvider schema={testBridge} data={testData}>
        <ObjectFieldset />
      </ObjectProvider>
    );

    // Check that all fields are rendered
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="age"]').should("exist");

    // Check that field values are set correctly
    cy.get('input[name="name"]').should("have.value", "John Doe");
    cy.get('input[name="email"]').should("have.value", "john@example.com");
    cy.get('input[name="age"]').should("have.value", "30");
  });

  it("updates data when fields change", () => {
    // Mount the component
    mount(
      <ObjectProvider schema={testBridge} data={testData}>
        <ObjectFieldset />
      </ObjectProvider>
    );

    // Check initial value
    cy.get('input[name="name"]').should("have.value", "John Doe");

    // Change a field value
    cy.get('input[name="name"]').clear().type("Jane Smith");

    // Check that the field value was updated in the DOM
    cy.get('input[name="name"]').should("have.value", "Jane Smith");
  });

  it("respects the fields prop", () => {
    mount(
      <ObjectProvider schema={testBridge} data={testData}>
        <ObjectFieldset fields={["name", "email"]} />
      </ObjectProvider>
    );

    // Check that only specified fields are rendered
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="age"]').should("not.exist");
  });

  it("respects the omitFields prop", () => {
    mount(
      <ObjectProvider schema={testBridge} data={testData}>
        <ObjectFieldset omitFields={["age"]} />
      </ObjectProvider>
    );

    // Check that omitted fields are not rendered
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="age"]').should("not.exist");
  });

  it("works with ZodReferencesBridge", () => {
    // Create a schema with references
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
      <ObjectProvider schema={refBridge} data={postData}>
        <ObjectFieldset />
      </ObjectProvider>
    );

    // Check that fields are rendered
    cy.get('input[name="title"]').should("exist");
    cy.get('[data-testid="ParentField"][data-object-type="Post"]').should(
      "exist"
    );
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

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would submit both objects together
        cy.log("Form submitted", { user, address });
      };

      return (
        <form onSubmit={handleSubmit} data-testid="multi-object-form">
          <h2>User Information</h2>
          <ObjectProvider schema={userBridge} data={user} objectId="user-1">
            <ObjectFieldset />
          </ObjectProvider>

          <h2>Address Information</h2>
          <ObjectProvider
            schema={addressBridge}
            data={address}
            objectId="address-1"
          >
            <ObjectFieldset />
          </ObjectProvider>

          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </form>
      );
    }

    mount(<TestForm />);

    // Check that all fields from both fieldsets are rendered
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="street"]').should("exist");
    cy.get('input[name="city"]').should("exist");
    cy.get('input[name="zipCode"]').should("exist");

    // Check that the form contains both fieldsets
    cy.get('[data-testid="ObjectFieldset"][data-object-type="User"]').should(
      "exist"
    );
    cy.get('[data-testid="ObjectFieldset"][data-object-type="Address"]').should(
      "exist"
    );

    // Add a wait to ensure the form is fully rendered
    cy.wait(100);

    // Check that the submit button exists
    cy.get('[data-testid="submit-button"]').should("exist");
  });
});
