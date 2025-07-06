// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import ReferenceArrayField from "../../../src/components/FormWithReferences/ReferenceArrayField";
import ReferenceSingleField from "../../../src/components/FormWithReferences/ReferenceSingleField";
import { referenceArrayField } from "./ReferenceArrayField.interactable";

// Component names as constants to avoid typos and make refactoring easier
const REFERENCE_ARRAY_FIELD = "ReferenceArrayField";
const REFERENCE_SINGLE_FIELD = "ReferenceSingleField";

// A minimal form context for testing ReferenceArrayField
const MinimalFormContext = ({
  fieldName = "tags",
  label = "Tags",
  required = false,
  disabled = false,
  error = false,
  errorMessage = "",
  value = [],
  onChange = () => {},
  reference,
  objectType = "Area",
  children,
}) => {
  // Create a simple schema for the field
  const schema = z.object({
    [fieldName]: z.array(z.string()).optional(),
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

describe("ReferenceArrayField Interactable", () => {
  // Sample data for testing
  const tagsData = [
    { _id: "tag1", name: "Fantasy" },
    { _id: "tag2", name: "Sci-Fi" },
    { _id: "tag3", name: "Horror" },
    { _id: "tag4", name: "Adventure" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "tag",
    type: RelationshipType.MANY_TO_MANY,
    foreignField: "_id",
    options: tagsData,
  };

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  describe("ReferenceArrayField-specific functionality", () => {
    beforeEach(() => {
      // Create a simple onChange function
      const onChange = cy.stub().as("onChange");

      // Mount the component within a minimal form context
      mount(
        <div className="container">
          <MinimalFormContext
            fieldName="tags"
            onChange={onChange}
            reference={referenceMetadata}
            objectType="Area"
          >
            <ReferenceArrayField
              name="tags"
              label="Tags"
              reference={referenceMetadata}
              objectType="Area"
            />
          </MinimalFormContext>
        </div>
      );
    });

    it("should render with the correct data-testid", () => {
      // Create the interactable and verify it can find the element
      const field = referenceArrayField("tags", "Area");
      field.getElement().should("exist");
    });

    it("should handle selecting multiple values", () => {
      // Select multiple options and verify the onChange is called with the correct values
      const field = referenceArrayField("tags", "Area");
      field.selectById(["tag1", "tag2"]);

      // Check that onChange was called with the correct values
      cy.get("@onChange").should("have.been.calledWith", ["tag1", "tag2"]);
    });

    it("should handle clearing selections", () => {
      // First select some values
      const field = referenceArrayField("tags", "Area");
      field.selectById(["tag1", "tag2"]);

      // Then clear them by selecting an empty array
      field.selectById([]);

      // Check that onChange was called with an empty array
      cy.get("@onChange").should("have.been.calledWith", []);
    });
  });

  describe("Special case handling", () => {
    it("should handle empty reference options gracefully", () => {
      // Mount with empty options
      mount(
        <div className="container">
          <MinimalFormContext
            fieldName="tags"
            onChange={cy.stub()}
            reference={{
              ...referenceMetadata,
              options: [],
            }}
            objectType="Area"
          >
            <ReferenceArrayField
              name="tags"
              label="Tags"
              reference={{
                ...referenceMetadata,
                options: [],
              }}
              objectType="Area"
            />
          </MinimalFormContext>
        </div>
      );

      const field = referenceArrayField("tags", "Area");
      field.getElement().should("exist");
      // Should show a disabled input with a message about no options
      field.getElement().parent().should("have.class", "Mui-disabled");
      cy.contains("No options available").should("exist");
    });
  });

  describe("Multiple fields", () => {
    // Sample data for categories
    const categoriesData = [
      { _id: "cat1", name: "Action" },
      { _id: "cat2", name: "Drama" },
      { _id: "cat3", name: "Comedy" },
    ];

    // Define category reference metadata for testing
    const categoryReferenceMetadata = {
      name: "category",
      type: RelationshipType.MANY_TO_MANY,
      foreignField: "_id",
      options: categoriesData,
    };

    it("should handle fields of different object types", () => {
      // Create a schema with both fields
      const schema = z.object({
        tags: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
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
              <ReferenceArrayField
                name="tags"
                label="Tags"
                reference={referenceMetadata}
                objectType="Area"
              />
            </div>
            <div className="movieContainer">
              <ReferenceArrayField
                name="categories"
                label="Categories"
                reference={categoryReferenceMetadata}
                objectType="Movie"
              />
            </div>
          </AutoForm>
        </div>
      );

      // Create interactables for both fields
      const areaField = referenceArrayField("tags", "Area");
      const movieField = referenceArrayField("categories", "Movie");

      // Verify both fields exist with different data-testid attributes based on objectType
      areaField.getElement().should("exist");
      movieField.getElement().should("exist");
      cy.get("[data-testid*='AreaReferenceArrayField']").should("exist");
      cy.get("[data-testid*='MovieReferenceArrayField']").should("exist");
    });

    it("should handle fields of the same type but different names", () => {
      // Create a schema with both fields
      const schema = z.object({
        primaryTags: z.array(z.string()).optional(),
        secondaryTags: z.array(z.string()).optional(),
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

      // Mount component with two fields of the same object type but different names
      mount(
        <div>
          <AutoForm schema={bridge} model={{}} context={context}>
            <div className="areaContainer1">
              <ReferenceArrayField
                name="primaryTags"
                label="Primary Tags"
                reference={referenceMetadata}
                objectType="Area"
              />
            </div>
            <div className="areaContainer2">
              <ReferenceArrayField
                name="secondaryTags"
                label="Secondary Tags"
                reference={referenceMetadata}
                objectType="Area"
              />
            </div>
          </AutoForm>
        </div>
      );

      // Create interactables for both fields
      const primaryField = referenceArrayField("primaryTags", "Area");
      const secondaryField = referenceArrayField("secondaryTags", "Area");

      // Verify both fields exist and can be distinguished by name
      primaryField.getElement().should("exist");
      secondaryField.getElement().should("exist");
      cy.get("[data-testid*='AreaReferenceArrayField']").should(
        "have.length",
        2
      );

      // Verify they have different field names
      cy.get("[data-field-name='primaryTags']").should("exist");
      cy.get("[data-field-name='secondaryTags']").should("exist");
    });
  });
});
