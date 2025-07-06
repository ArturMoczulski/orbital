// @ts-nocheck
/// <reference types="cypress" />
import { mount } from "cypress/react";
import React from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import MultiObjectSelector from "../../../src/components/ObjectSelector/MultiObjectSelector";
import { multiObjectSelector } from "./MultiObjectSelector.interactable";

// A minimal form context for testing MultiObjectSelector
const MinimalFormContext = ({
  fieldName = "tags",
  label = "Tags",
  required = false,
  disabled = false,
  error = false,
  errorMessage = "",
  value = [],
  onChange = () => {},
  options,
  idField = "_id",
  displayField = "name",
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
        MultiObjectSelector,
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

describe("MultiObjectSelector Interactable", () => {
  // Sample data for testing
  const tagsData = [
    { _id: "tag1", name: "Fantasy" },
    { _id: "tag2", name: "Sci-Fi" },
    { _id: "tag3", name: "Horror" },
    { _id: "tag4", name: "Adventure" },
  ];

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  describe("Basic functionality", () => {
    it("should render with the correct data-testid", () => {
      // Mount a component first
      mount(
        <div className="container">
          <MultiObjectSelector
            name="tags"
            label="Tags"
            options={tagsData}
            onChange={() => {}}
            value={[]}
            id="tags"
            data-testid="MultiObjectSelector"
            data-field-name="tags"
          />
        </div>
      );

      // Create the interactable and verify it can find the element
      const field = multiObjectSelector("tags");
      field.getElement().should("exist");
    });

    it("should handle selecting multiple values", () => {
      // Create a component with controlled state
      const TestComponent = () => {
        const [value, setValue] = React.useState([]);

        return (
          <div className="container">
            <MultiObjectSelector
              name="tags"
              label="Tags"
              options={tagsData}
              onChange={(newValue) => {
                console.log("onChange called with:", newValue);
                setValue(newValue);
              }}
              value={value}
              id="tags"
              data-testid="MultiObjectSelector"
              data-field-name="tags"
            />
          </div>
        );
      };

      // Mount the component
      mount(<TestComponent />);

      // Get the field interactable
      const field = multiObjectSelector("tags");

      // First, verify the field is empty initially
      field.getElement().should("not.have.class", "Mui-error");
      field.getElement().find('[role="combobox"]').should("not.contain.text");

      // Open the dropdown
      field.openDropdown();

      // Select tag1
      cy.get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('[data-value-id="tag1"]')
        .click();

      // Verify the selected value appears in the combobox
      field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Fantasy");

      // Select tag2
      cy.get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('[data-value-id="tag2"]')
        .click();

      // Verify both selected values appear in the combobox
      field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Fantasy");
      field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Sci-Fi");

      // Open the dropdown again to verify the UI state
      field.openDropdown();

      // Check that the items are selected in the dropdown
      cy.get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('[data-value-id="tag1"]')
        .should("have.attr", "aria-selected", "true");

      cy.get("body")
        .find('.MuiPopover-root, [role="presentation"] .MuiPaper-root')
        .find('[data-value-id="tag2"]')
        .should("have.attr", "aria-selected", "true");

      // Close the dropdown
      field.closeDropdown();
    });

    it("should handle clearing selections", () => {
      // Create a component with controlled state
      const TestComponent = () => {
        const [value, setValue] = React.useState([]);

        return (
          <div className="container">
            <MultiObjectSelector
              name="tags"
              label="Tags"
              options={tagsData}
              onChange={(newValue) => {
                console.log("onChange called with:", newValue);
                setValue(newValue);
              }}
              value={value}
              id="tags"
              data-testid="MultiObjectSelector"
              data-field-name="tags"
            />
          </div>
        );
      };

      // Mount the component
      mount(<TestComponent />);

      // Get the field interactable
      const field = multiObjectSelector("tags");

      // First select some values
      field.selectById(["tag1", "tag2"]);

      // Then clear them by selecting an empty array
      field.selectById([]);

      // Material UI might not call onChange with an empty array when clearing
      // So we'll check that getSelectedValues() returns an empty array
      field.getSelectedValues().should("deep.equal", []);
    });
  });

  describe("Special case handling", () => {
    it("should handle empty options gracefully", () => {
      // Mount with empty options
      mount(
        <div className="container">
          <MinimalFormContext
            fieldName="tags"
            onChange={cy.stub()}
            options={[]}
          >
            <MultiObjectSelector name="tags" label="Tags" options={[]} />
          </MinimalFormContext>
        </div>
      );

      const field = multiObjectSelector("tags");

      // Debug: Log the element and its parent structure
      field.getElement().then(($el) => {
        cy.log(`Field element found: ${$el.length > 0 ? "Yes" : "No"}`);
        cy.log(`Field HTML: ${$el.prop("outerHTML")}`);
        cy.log(`Parent HTML: ${$el.parent().prop("outerHTML")}`);
        cy.log(`Has Mui-disabled class: ${$el.hasClass("Mui-disabled")}`);
        cy.log(
          `Parent has Mui-disabled class: ${$el.parent().hasClass("Mui-disabled")}`
        );

        // Log all elements with Mui-disabled class
        cy.log(
          `Elements with Mui-disabled in the DOM: ${Cypress.$(".Mui-disabled").length}`
        );
        Cypress.$(".Mui-disabled").each((i, el) => {
          cy.log(`Disabled element ${i}: ${Cypress.$(el).prop("outerHTML")}`);
        });
      });

      field.getElement().should("exist");

      // Try both the element itself and various parent elements
      cy.log("Checking for Mui-disabled class");
      field.getElement().should("have.class", "Mui-disabled");

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

    it("should handle fields with different names", () => {
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
            MultiObjectSelector,
          },
        },
      };

      // Mount component with two fields of the same type but different names
      mount(
        <div>
          <AutoForm schema={bridge} model={{}} context={context}>
            <div className="container1">
              <MultiObjectSelector
                name="primaryTags"
                label="Primary Tags"
                options={tagsData}
                data-testid="PrimaryTags"
              />
            </div>
            <div className="container2">
              <MultiObjectSelector
                name="secondaryTags"
                label="Secondary Tags"
                options={tagsData}
                data-testid="SecondaryTags"
              />
            </div>
          </AutoForm>
        </div>
      );

      // Create interactables for both fields
      const primaryField = multiObjectSelector(
        "primaryTags",
        undefined,
        "PrimaryTags"
      );
      const secondaryField = multiObjectSelector(
        "secondaryTags",
        undefined,
        "SecondaryTags"
      );

      // Verify both fields exist and can be distinguished by name
      primaryField.getElement().should("exist");
      secondaryField.getElement().should("exist");

      // Verify they have different field names
      cy.get("[data-field-name='primaryTags']").should("exist");
      cy.get("[data-field-name='secondaryTags']").should("exist");
    });

    it("should handle fields with different data", () => {
      // Create a component with controlled state for both fields
      const TestComponent = () => {
        const [tagsValue, setTagsValue] = React.useState<string[]>([]);
        const [categoriesValue, setCategoriesValue] = React.useState<string[]>(
          []
        );

        return (
          <div>
            <div className="tagsContainer">
              <MultiObjectSelector
                name="tags"
                label="Tags"
                options={tagsData}
                onChange={(newValue) => {
                  console.log("Tags onChange called with:", newValue);
                  setTagsValue(newValue);
                }}
                value={tagsValue}
                id="tags"
                data-testid="TagsSelector"
                data-field-name="tags"
              />
            </div>
            <div className="categoriesContainer">
              <MultiObjectSelector
                name="categories"
                label="Categories"
                options={categoriesData}
                onChange={(newValue) => {
                  console.log("Categories onChange called with:", newValue);
                  setCategoriesValue(newValue);
                }}
                value={categoriesValue}
                id="categories"
                data-testid="CategoriesSelector"
                data-field-name="categories"
              />
            </div>
          </div>
        );
      };

      // Mount the component
      mount(<TestComponent />);

      // Create interactables for both fields
      const tagsField = multiObjectSelector("tags", undefined, "TagsSelector");
      const categoriesField = multiObjectSelector(
        "categories",
        undefined,
        "CategoriesSelector"
      );

      // Verify both fields exist
      tagsField.getElement().should("exist");
      categoriesField.getElement().should("exist");

      // Select different values in each field
      tagsField.selectById(["tag1", "tag2"]);

      // Wait a moment for the state to update
      cy.wait(100);

      categoriesField.selectById(["cat1", "cat3"]);

      // Wait a moment for the state to update
      cy.wait(100);

      // Verify the selected values by checking the combobox text content
      tagsField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Fantasy");
      tagsField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Sci-Fi");

      categoriesField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Action");
      categoriesField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Comedy");
    });
  });
});
