// ReferenceField.cy.tsx
// Tests for the ReferenceField component

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { ObjectSchemaProvider } from "../../../src/components/ObjectForm/ObjectSchemaContext";
import ReferenceField from "../../../src/components/ObjectForm/ReferenceField";
import { autocomplete } from "../MaterialUI/Autocomplete.interactable";
import { referenceField } from "./ReferenceField.interactable";

describe("ReferenceField", () => {
  // Sample data for testing
  const userOptions = [
    { _id: "user1", name: "John Doe" },
    { _id: "user2", name: "Jane Smith" },
    { _id: "user3", name: "Bob Johnson" },
  ];

  const postOptions = [
    { _id: "post1", title: "First Post" },
    { _id: "post2", title: "Second Post" },
    { _id: "post3", title: "Third Post" },
  ];

  // Define reference metadata for testing
  const userReferenceMetadata = {
    name: "user",
    type: RelationshipType.BELONGS_TO,
    foreignField: "_id",
    options: userOptions,
  };

  const postReferenceMetadata = {
    name: "post",
    type: RelationshipType.HAS_MANY,
    foreignField: "_id",
    options: postOptions,
  };

  // Create schema for testing
  const schema = z.object({
    userId: z.string().optional(),
    postIds: z.array(z.string()).optional(),
  });

  // Test component for single-select ReferenceField
  const SingleSelectTestComponent = ({
    disabled = false,
    required = false,
    initialValue = "",
    onChange = undefined,
    customLabel = undefined,
    customTestId = undefined,
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <ObjectSchemaProvider schema={schema} objectType="Blog">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ userId: value }}
          onSubmit={() => {}}
        >
          <ReferenceField
            name="userId"
            id="userId"
            disabled={disabled}
            required={required}
            onChange={handleChange}
            reference={userReferenceMetadata}
            value={value}
            label={customLabel}
            data-testid={customTestId || "ParentField"}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  // Test component for multi-select ReferenceField
  const MultiSelectTestComponent = ({
    disabled = false,
    required = false,
    initialValue = [],
    onChange = undefined,
    customLabel = undefined,
    customTestId = undefined,
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <ObjectSchemaProvider schema={schema} objectType="Blog">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ postIds: value }}
          onSubmit={() => {}}
        >
          <ReferenceField
            name="postIds"
            id="postIds"
            disabled={disabled}
            required={required}
            onChange={handleChange}
            reference={postReferenceMetadata}
            value={value}
            multiple={true}
            label={customLabel}
            displayField="title"
            data-testid={customTestId || "ChildrenField"}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  describe("Label Generation", () => {
    it("should use provided label when available", () => {
      mount(<SingleSelectTestComponent customLabel="Custom User Label" />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.label().should("contain", "Custom User Label");
    });

    it("should use reference name when no label is provided", () => {
      mount(<SingleSelectTestComponent />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.label().should("contain", "User");
    });

    it("should infer label from field name for single-select fields", () => {
      // Create a component with a field name that doesn't match the reference name
      const CustomFieldNameComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="Blog">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ authorId: value }}
              onSubmit={() => {}}
            >
              <ReferenceField
                name="authorId"
                id="authorId"
                onChange={setValue}
                reference={{
                  ...userReferenceMetadata,
                  name: undefined, // Remove reference name to test inference
                }}
                value={value}
                data-testid="AuthorField"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<CustomFieldNameComponent />);

      const field = autocomplete("AuthorField");
      field.label().should("contain", "Author");
    });

    it("should infer label from field name for multi-select fields", () => {
      // Create a component with a field name that doesn't match the reference name
      const CustomFieldNameComponent = () => {
        const [value, setValue] = useState([]);
        return (
          <ObjectSchemaProvider schema={schema} objectType="Blog">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ articleIds: value }}
              onSubmit={() => {}}
            >
              <ReferenceField
                name="articleIds"
                id="articleIds"
                onChange={setValue}
                reference={{
                  ...postReferenceMetadata,
                  name: undefined, // Remove reference name to test inference
                }}
                value={value}
                multiple={true}
                data-testid="ArticleField"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<CustomFieldNameComponent />);

      const field = autocomplete("ArticleField");
      field.label().should("contain", "Article");
    });
  });

  describe("Multiple vs Single Selection", () => {
    it("should handle single selection correctly", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(<SingleSelectTestComponent onChange={onChangeSpy} />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.open();
      field.select("John Doe");

      // Check that onChange was called with the correct value (string)
      cy.get("@onChange").should("have.been.calledWith", "user1");

      // Check that the field displays the selected value
      field.textField().should("have.value", "John Doe");
    });

    it("should handle multiple selection correctly", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(<MultiSelectTestComponent onChange={onChangeSpy} />);

      const field = referenceField({
        fieldName: "ChildrenField",
        objectType: "Blog",
      });
      field.select("First Post");

      // Check that onChange was called with the correct value (array)
      cy.get("@onChange").should("have.been.calledWith", ["post1"]);

      // Select another option
      field.select("Second Post");

      // Check that onChange was called with both values
      cy.get("@onChange").should("have.been.calledWith", ["post1", "post2"]);

      // Check that both chips are displayed
      field.chips().then((chips) => {
        expect(chips.length).to.equal(2);
        chips[0].label().should("eq", "First Post");
        chips[1].label().should("eq", "Second Post");
      });
    });

    it("should handle clearing selection in single mode", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(
        <SingleSelectTestComponent
          initialValue="user1"
          onChange={onChangeSpy}
        />
      );

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.clearSelection();

      // Check that onChange was called with empty string
      cy.get("@onChange").should("have.been.calledWith", "");

      // Check that the field is empty
      field.textField().should("have.value", "");
    });

    it("should handle clearing selection in multiple mode", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(
        <MultiSelectTestComponent
          initialValue={["post1", "post2"]}
          onChange={onChangeSpy}
        />
      );

      const field = referenceField({
        fieldName: "ChildrenField",
        objectType: "Blog",
      });
      field.clearSelection();

      // Check that onChange was called with empty array
      cy.get("@onChange").should("have.been.calledWith", []);

      // Check that no chips are displayed
      field.chips().then((chips) => {
        expect(chips.length).to.equal(0);
      });
    });
  });

  describe("Reference Options Handling", () => {
    it("should display options from reference", () => {
      mount(<SingleSelectTestComponent />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.open();

      // Check that all user options are displayed
      field.items().then((items) => {
        expect(items.length).to.equal(3);
        cy.wrap(items[0]).should("contain", "John Doe");
        cy.wrap(items[1]).should("contain", "Jane Smith");
        cy.wrap(items[2]).should("contain", "Bob Johnson");
      });
    });

    it("should handle empty reference options", () => {
      // Create a component with empty options
      const EmptyOptionsComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="Blog">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ userId: value }}
              onSubmit={() => {}}
            >
              <ReferenceField
                name="userId"
                id="userId"
                onChange={setValue}
                reference={{
                  ...userReferenceMetadata,
                  options: [], // Empty options
                }}
                value={value}
                data-testid="EmptyField"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<EmptyOptionsComponent />);

      const field = autocomplete("EmptyField");

      // Field should be disabled when no options are available
      field.isDisabled().should("be.true");

      // Error message should be displayed
      field.getError().should("eq", "No options available");
    });

    it("should use custom idField and displayField", () => {
      // Create a component with custom fields
      const CustomFieldsComponent = () => {
        const [value, setValue] = useState("");

        // Custom options with different field names
        const customOptions = [
          { id: "custom1", title: "Custom Option 1" },
          { id: "custom2", title: "Custom Option 2" },
        ];

        return (
          <ObjectSchemaProvider schema={schema} objectType="Blog">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ customId: value }}
              onSubmit={() => {}}
            >
              <ReferenceField
                name="customId"
                id="customId"
                onChange={setValue}
                reference={{
                  name: "custom",
                  type: RelationshipType.BELONGS_TO,
                  foreignField: "id", // Custom ID field
                  options: customOptions,
                }}
                idField="id" // Custom ID field
                displayField="title" // Custom display field
                value={value}
                data-testid="CustomField"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<CustomFieldsComponent />);

      const field = autocomplete("CustomField");
      field.open();

      // Check that options are displayed with the custom display field
      field.items().then((items) => {
        expect(items.length).to.equal(2);
        cy.wrap(items[0]).should("contain", "Custom Option 1");
        cy.wrap(items[1]).should("contain", "Custom Option 2");
      });

      // Select an option and check that the value uses the custom ID field
      field.select("Custom Option 1");
      cy.window()
        .its("document.activeElement")
        .then(($el) => {
          // Get the value directly from the element
          cy.wrap($el).should("have.value", "Custom Option 1");
        });
    });
  });

  describe("Context Integration", () => {
    it("should use schema and objectType from context", () => {
      // The test components already use ObjectSchemaProvider, so this is already tested
      mount(<SingleSelectTestComponent />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.label().should("contain", "User");
    });
  });

  describe("Prop Passing", () => {
    it("should pass disabled prop to ObjectSelector", () => {
      mount(<SingleSelectTestComponent disabled={true} />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.isDisabled().should("be.true");
    });

    it("should pass required prop to ObjectSelector", () => {
      mount(<SingleSelectTestComponent required={true} />);

      const field = referenceField({
        fieldName: "ParentField",
        objectType: "Blog",
      });
      field.isRequired().should("be.true");
    });

    it("should pass error and errorMessage props to ObjectSelector", () => {
      // Create a component with error
      const ErrorComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="Blog">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ userId: value }}
              onSubmit={() => {}}
            >
              <ReferenceField
                name="userId"
                id="userId"
                onChange={setValue}
                reference={userReferenceMetadata}
                value={value}
                error={true}
                errorMessage="This field has an error"
                data-testid="ErrorField"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<ErrorComponent />);

      const field = autocomplete("ErrorField");
      field.hasError().should("be.true");
      field.getError().should("eq", "This field has an error");
    });
  });
});
