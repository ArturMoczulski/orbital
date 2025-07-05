// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import ReferenceArrayField from "../../../src/components/FormWithReferences/ReferenceArrayField";
import ReferenceSingleField from "../../../src/components/FormWithReferences/ReferenceSingleField";
import { referenceSingleField } from "./ReferenceSingleField.interactable";

// Component names as constants to avoid typos and make refactoring easier
const REFERENCE_ARRAY_FIELD = "ReferenceArrayField";
const REFERENCE_SINGLE_FIELD = "ReferenceSingleField";

// A minimal form context for testing ReferenceSingleField
const MinimalFormContext = ({
  fieldName = "worldId",
  label = "World",
  required = false,
  disabled = false,
  error = false,
  errorMessage = "",
  value = "",
  onChange = () => {},
  reference,
  objectType = "Area",
  children,
}) => {
  // Create a simple schema for the field
  const schema = z.object({
    [fieldName]: z.string().optional(),
  });

  // Create a bridge with the schema
  const bridge = new ZodBridge({
    schema,
  });

  // Register custom field types with Uniforms
  const context = {
    uniforms: {
      fieldTypes: {
        [REFERENCE_SINGLE_FIELD]: ReferenceSingleField,
        [REFERENCE_ARRAY_FIELD]: ReferenceArrayField,
      },
    },
  };

  return (
    <div className="test-form-container" data-testid="test-form-container">
      <AutoForm
        schema={bridge}
        onSubmit={(data) => {
          console.log("Form submitted with data:", data);
          onChange(data[fieldName]);
        }}
        onChange={(key, value) => {
          // Also call onChange directly when a field value changes
          if (key === fieldName) {
            onChange(value);
          }
        }}
        model={{ [fieldName]: value }}
        showInlineError
        context={context}
      >
        {children}
      </AutoForm>
    </div>
  );
};

describe("ReferenceSingleField Interactable", () => {
  // Sample data for testing
  const worldsData = [
    { _id: "world1", name: "Earth" },
    { _id: "world2", name: "Mars" },
    { _id: "world3", name: "Jupiter" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "world",
    type: RelationshipType.MANY_TO_ONE,
    foreignField: "_id",
    options: worldsData,
  };

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  describe("ReferenceSingleField-specific functionality", () => {
    beforeEach(() => {
      // Create a simple onChange function
      const onChange = cy.stub().as("onChange");

      // Mount the component within a minimal form context
      mount(
        <div className="container">
          <MinimalFormContext
            fieldName="worldId"
            onChange={onChange}
            reference={referenceMetadata}
            objectType="Area"
          >
            <ReferenceSingleField
              name="worldId"
              label="World"
              reference={referenceMetadata}
              objectType="Area"
            />
          </MinimalFormContext>
        </div>
      );
    });

    it("should render with the correct data-testid", () => {
      // Add debugging logs to see what's actually being rendered
      cy.log("Debugging component rendering");

      // Log all elements with data-testid attributes
      cy.get("[data-testid]").then(($elements) => {
        cy.log(`Found ${$elements.length} elements with data-testid`);
        $elements.each((index, el) => {
          const testId = Cypress.$(el).attr("data-testid");
          const html = Cypress.$(el).prop("outerHTML");
          cy.log(`Element ${index} data-testid: ${testId}`);
          cy.log(`Element ${index} HTML: ${html}`);
        });
      });

      // Try to find the element with a partial match on data-testid
      cy.get("[data-testid*='Area']").then(($elements) => {
        cy.log(
          `Found ${$elements.length} elements with data-testid containing 'Area'`
        );
        $elements.each((index, el) => {
          const testId = Cypress.$(el).attr("data-testid");
          cy.log(`Element ${index} data-testid: ${testId}`);
        });
      });

      // Verify the component has the correct data-testid attribute
      cy.get(
        "[data-testid*='AreaReferenceSingleField ReferenceSingleField']"
      ).should("exist");

      // Create the interactable and verify it can find the element
      const field = referenceSingleField("worldId", "Area");
      field.getElement().should("exist");
    });

    it("should handle reference metadata correctly", () => {
      // Select an option and verify the onChange is called with the correct value
      const field = referenceSingleField("worldId", "Area");
      field.selectByText("Earth");

      // Check that onChange was called with the correct value
      cy.get("@onChange").should("have.been.calledWith", "world1");
    });
  });

  describe("Special case handling", () => {
    it("should handle the special case for worldId field in isRequired", () => {
      // Mount with required=true
      mount(
        <div className="container">
          <MinimalFormContext
            fieldName="worldId"
            onChange={cy.stub()}
            reference={referenceMetadata}
            required={true}
            objectType="Area"
          >
            <ReferenceSingleField
              name="worldId"
              label="World"
              reference={referenceMetadata}
              required={true}
              objectType="Area"
            />
          </MinimalFormContext>
        </div>
      );

      // Use the interactable to check if the field is required
      const field = referenceSingleField("worldId", "Area");
      field.isRequired().should("eq", true);
    });

    it("should handle empty reference options gracefully", () => {
      // Mount with empty options
      mount(
        <div className="container">
          <MinimalFormContext
            fieldName="worldId"
            onChange={cy.stub()}
            reference={{
              ...referenceMetadata,
              options: [],
            }}
            objectType="Area"
          >
            <ReferenceSingleField
              name="worldId"
              label="World"
              reference={{
                ...referenceMetadata,
                options: [],
              }}
              objectType="Area"
            />
          </MinimalFormContext>
        </div>
      );

      const field = referenceSingleField("worldId", "Area");
      field.getElement().should("exist");
      // Should fall back to a text field (no select attribute)
      field.getElement().should("not.have.attr", "select");
    });
  });

  describe("Multiple fields", () => {
    // Sample data for users
    const usersData = [
      { _id: "user1", name: "Alice" },
      { _id: "user2", name: "Bob" },
      { _id: "user3", name: "Charlie" },
    ];

    // Define user reference metadata for testing
    const userReferenceMetadata = {
      name: "user",
      type: RelationshipType.MANY_TO_ONE,
      foreignField: "_id",
      options: usersData,
    };

    it("should handle fields of different object types", () => {
      // Create a schema with both fields
      const schema = z.object({
        worldId: z.string().optional(),
        userId: z.string().optional(),
      });

      // Create a bridge with the schema
      const bridge = new ZodBridge({
        schema,
      });

      // Register custom field types with Uniforms
      const context = {
        uniforms: {
          fieldTypes: {
            [REFERENCE_SINGLE_FIELD]: ReferenceSingleField,
            [REFERENCE_ARRAY_FIELD]: ReferenceArrayField,
          },
        },
      };

      // Mount component with two fields of different object types
      mount(
        <div>
          <AutoForm schema={bridge} model={{}} context={context}>
            <div className="areaContainer">
              <ReferenceSingleField
                name="worldId"
                label="World"
                reference={referenceMetadata}
                objectType="Area"
              />
            </div>
            <div className="userContainer">
              <ReferenceSingleField
                name="userId"
                label="User"
                reference={userReferenceMetadata}
                objectType="User"
              />
            </div>
          </AutoForm>
        </div>
      );

      // Create interactables for both fields
      const areaField = referenceSingleField("worldId", "Area");
      const userField = referenceSingleField("userId", "User");

      // Verify both fields exist with different data-testid attributes based on objectType
      areaField.getElement().should("exist");
      userField.getElement().should("exist");
      cy.get(
        "[data-testid*='AreaReferenceSingleField ReferenceSingleField']"
      ).should("exist");
      cy.get(
        "[data-testid*='UserReferenceSingleField ReferenceSingleField']"
      ).should("exist");
    });

    it("should handle fields of the same type but different IDs", () => {
      // Create a schema with both fields
      const schema = z.object({
        primaryWorldId: z.string().optional(),
        secondaryWorldId: z.string().optional(),
      });

      // Create a bridge with the schema
      const bridge = new ZodBridge({
        schema,
      });

      // Register custom field types with Uniforms
      const context = {
        uniforms: {
          fieldTypes: {
            [REFERENCE_SINGLE_FIELD]: ReferenceSingleField,
            [REFERENCE_ARRAY_FIELD]: ReferenceArrayField,
          },
        },
      };

      // Mount component with two fields of the same object type but different IDs
      mount(
        <div>
          <AutoForm schema={bridge} model={{}} context={context}>
            <div className="areaContainer1">
              <ReferenceSingleField
                name="primaryWorldId"
                label="Primary World"
                reference={referenceMetadata}
                objectType="Area"
              />
            </div>
            <div className="areaContainer2">
              <ReferenceSingleField
                name="secondaryWorldId"
                label="Secondary World"
                reference={referenceMetadata}
                objectType="Area"
              />
            </div>
          </AutoForm>
        </div>
      );

      // Create interactables for both fields
      const primaryField = referenceSingleField("primaryWorldId", "Area");
      const secondaryField = referenceSingleField("secondaryWorldId", "Area");

      // Verify both fields exist and can be distinguished by name
      primaryField.getElement().should("exist");
      secondaryField.getElement().should("exist");
      cy.get(
        "[data-testid*='AreaReferenceSingleField ReferenceSingleField']"
      ).should("have.length", 2);
    });
  });
});
