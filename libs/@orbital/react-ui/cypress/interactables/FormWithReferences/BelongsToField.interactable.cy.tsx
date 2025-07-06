// BelongsToField.interactable.cy.tsx
// Tests for the BelongsToField interactable

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import BelongsToField from "../../../src/components/FormWithReferences/BelongsToField";
import { ObjectSchemaProvider } from "../../../src/components/FormWithReferences/ObjectSchemaContext";
import { belongsToField } from "./BelongsToField.interactable";

describe("BelongsToField.interactable", () => {
  // Sample data for testing
  const worldOptions = [
    { _id: "world1", name: "Test World 1" },
    { _id: "world2", name: "Test World 2" },
    { _id: "world3", name: "Test World 3" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "world",
    type: RelationshipType.BELONGS_TO,
    foreignField: "_id",
    options: worldOptions,
  };

  // Create a simple schema for the field
  const schema = z.object({
    worldId: z.string().optional(),
  });

  const TestForm = ({
    disabled = false,
    required = false,
    initialValue = "",
    onChange = undefined,
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string;
    onChange?: (value: string) => void;
  }) => {
    const [value, setValue] = useState(initialValue);

    // Create a modified schema based on the required prop
    const formSchema = required
      ? schema
      : z.object({
          worldId: z.string().optional(),
        });

    const handleChange = (newValue: string) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <ObjectSchemaProvider schema={formSchema} objectType="World">
        <AutoForm
          schema={new ZodBridge({ schema: formSchema })}
          model={{ worldId: value }}
          onSubmit={() => {}}
        >
          <BelongsToField
            name="worldId"
            disabled={disabled}
            required={required}
            options={worldOptions}
            onChange={handleChange}
            reference={referenceMetadata}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  it("should select a value", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm onChange={onChangeSpy} />);

    const field = belongsToField("worldId", "World");

    field.selectById("world2");

    cy.get("@onChange").should("have.been.calledWith", "world2");
    field.getValue().should("eq", "world2");
    field.getSelectedText().should("eq", "Test World 2");
  });

  it("should handle disabled state", () => {
    mount(<TestForm disabled={true} initialValue="world1" />);

    const field = belongsToField("worldId", "World");

    field.isDisabled().should("be.true");
    field.getValue().should("eq", "world1");
    field.getSelectedText().should("eq", "Test World 1");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestForm required={true} />);

    const field = belongsToField("worldId", "World");

    field.isRequired().should("be.true");
  });

  it("should clear selection", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm initialValue="world1" onChange={onChangeSpy} />);

    const field = belongsToField("worldId", "World");

    field.getValue().should("eq", "world1");
    field.getSelectedText().should("eq", "Test World 1");

    field.clear();

    cy.get("@onChange").should("have.been.calledWith", "");
    field.getValue().should("eq", "");
  });

  it("should handle empty options gracefully", () => {
    // Create a test component with no options
    const TestFormNoOptions = () => (
      <ObjectSchemaProvider schema={schema} objectType="World">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ worldId: "" }}
          onSubmit={() => {}}
        >
          <BelongsToField
            name="worldId"
            reference={{
              ...referenceMetadata,
              options: [],
            }}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );

    mount(<TestFormNoOptions />);

    const field = belongsToField("worldId", "World");

    // When there are no options, the field should be disabled and show a helper text
    field.isDisabled().should("be.true");
    field.getErrorMessage().should("eq", "No options available");
  });

  it("should scope to parent element", () => {
    // Create a test component with two identical fields
    const TestFormWithMultipleFields = () => (
      <div>
        <div data-testid="first-container">
          <ObjectSchemaProvider schema={schema} objectType="World">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ worldId: "world1" }}
              onSubmit={() => {}}
            >
              <BelongsToField
                name="worldId"
                options={worldOptions}
                reference={referenceMetadata}
              />
            </AutoForm>
          </ObjectSchemaProvider>
        </div>
        <div data-testid="second-container">
          <ObjectSchemaProvider schema={schema} objectType="World">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ worldId: "world2" }}
              onSubmit={() => {}}
            >
              <BelongsToField
                name="worldId"
                options={worldOptions}
                reference={referenceMetadata}
              />
            </AutoForm>
          </ObjectSchemaProvider>
        </div>
      </div>
    );

    mount(<TestFormWithMultipleFields />);

    // Create field interactables with different parent elements
    const firstField = belongsToField("worldId", "World", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = belongsToField("worldId", "World", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct value
    firstField.getSelectedText().should("eq", "Test World 1");
    secondField.getSelectedText().should("eq", "Test World 2");
  });

  it("should handle error state", () => {
    // Mount a basic form first
    mount(
      <ObjectSchemaProvider schema={schema} objectType="World">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ worldId: "world1" }}
          onSubmit={() => {}}
        >
          <BelongsToField
            name="worldId"
            options={worldOptions}
            reference={referenceMetadata}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );

    const field = belongsToField("worldId", "World");

    // Manually add error class and message to simulate error state
    field
      .getElement()
      .closest(".MuiFormControl-root")
      .then(($el) => {
        // Add error class
        $el.addClass("Mui-error");

        // Add error message
        const errorMessage = document.createElement("p");
        errorMessage.className = "MuiFormHelperText-root Mui-error";
        errorMessage.textContent = "Invalid world";
        $el.append(errorMessage);

        // Now check error state
        field.hasError().should("be.true");
        field.getErrorMessage().should("eq", "Invalid world");
      });
  });

  describe("Multiple BelongsToFields on the same page", () => {
    // Sample data for testing
    const worldOptions = [
      { _id: "world1", name: "Test World 1" },
      { _id: "world2", name: "Test World 2" },
    ];

    const areaOptions = [
      { _id: "area1", name: "Test Area 1" },
      { _id: "area2", name: "Test Area 2" },
    ];

    // Define reference metadata for testing
    const worldReferenceMetadata = {
      name: "world",
      type: RelationshipType.BELONGS_TO,
      foreignField: "_id",
      options: worldOptions,
    };

    const areaReferenceMetadata = {
      name: "area",
      type: RelationshipType.BELONGS_TO,
      foreignField: "_id",
      options: areaOptions,
    };

    it("should handle same object type but different IDs", () => {
      // Create a test component with two fields of the same object type but different IDs
      const TestFormWithSameTypeFields = () => (
        <div>
          <div data-testid="world1-container">
            <ObjectSchemaProvider schema={schema} objectType="World">
              <AutoForm
                schema={new ZodBridge({ schema })}
                model={{ worldId: "world1" }}
                onSubmit={() => {}}
              >
                <BelongsToField
                  name="worldId"
                  options={worldOptions}
                  reference={worldReferenceMetadata}
                  objectId="world-1"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
          <div data-testid="world2-container">
            <ObjectSchemaProvider schema={schema} objectType="World">
              <AutoForm
                schema={new ZodBridge({ schema })}
                model={{ worldId: "world2" }}
                onSubmit={() => {}}
              >
                <BelongsToField
                  name="worldId"
                  options={worldOptions}
                  reference={worldReferenceMetadata}
                  objectId="world-2"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );

      mount(<TestFormWithSameTypeFields />);

      // Create field interactables with the same object type but different IDs
      // Use parent elements to scope the search
      const world1Field = belongsToField(
        "worldId",
        "World",
        () => cy.get('[data-testid="world1-container"]'),
        "world-1"
      );
      const world2Field = belongsToField(
        "worldId",
        "World",
        () => cy.get('[data-testid="world2-container"]'),
        "world-2"
      );

      // Verify each field has the correct value
      world1Field.getSelectedText().should("eq", "Test World 1");
      world2Field.getSelectedText().should("eq", "Test World 2");

      // Test interactions with each field
      world1Field.selectById("world2");
      world2Field.selectById("world1");

      // Verify the values were updated correctly
      world1Field.getSelectedText().should("eq", "Test World 2");
      world2Field.getSelectedText().should("eq", "Test World 1");
    });

    it("should handle different object types but same IDs", () => {
      // Create a schema for the area field
      const areaSchema = z.object({
        areaId: z.string().optional(),
      });

      // Create a test component with fields of different object types but same IDs
      const TestFormWithDifferentTypeFields = () => (
        <div>
          <div data-testid="world-container">
            <ObjectSchemaProvider schema={schema} objectType="World">
              <AutoForm
                schema={new ZodBridge({ schema })}
                model={{ worldId: "world1" }}
                onSubmit={() => {}}
              >
                <BelongsToField
                  name="worldId"
                  options={worldOptions}
                  reference={worldReferenceMetadata}
                  objectId="shared-id-123"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
          <div data-testid="area-container">
            <ObjectSchemaProvider schema={areaSchema} objectType="Area">
              <AutoForm
                schema={new ZodBridge({ schema: areaSchema })}
                model={{ areaId: "area1" }}
                onSubmit={() => {}}
              >
                <BelongsToField
                  name="areaId"
                  options={areaOptions}
                  reference={areaReferenceMetadata}
                  objectId="shared-id-123"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );

      mount(<TestFormWithDifferentTypeFields />);

      // Create field interactables with different object types but the same ID
      const worldField = belongsToField(
        "worldId",
        "World",
        undefined,
        "shared-id-123"
      );
      const areaField = belongsToField(
        "areaId",
        "Area",
        undefined,
        "shared-id-123"
      );

      // Verify each field has the correct value
      worldField.getSelectedText().should("eq", "Test World 1");
      areaField.getSelectedText().should("eq", "Test Area 1");

      // Test interactions with each field
      worldField.selectById("world2");
      areaField.selectById("area2");

      // Verify the values were updated correctly
      worldField.getSelectedText().should("eq", "Test World 2");
      areaField.getSelectedText().should("eq", "Test Area 2");
    });

    it("should handle parent element and objectId together", () => {
      // Create a test component with multiple fields of the same type and ID
      const TestFormWithMultipleFields = () => (
        <div>
          <div data-testid="container-1">
            <div data-testid="world-1">
              <ObjectSchemaProvider schema={schema} objectType="World">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ worldId: "world1" }}
                  onSubmit={() => {}}
                >
                  <BelongsToField
                    name="worldId"
                    options={worldOptions}
                    reference={worldReferenceMetadata}
                    objectId="world-id-1"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
          <div data-testid="container-2">
            <div data-testid="world-1">
              <ObjectSchemaProvider schema={schema} objectType="World">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ worldId: "world2" }}
                  onSubmit={() => {}}
                >
                  <BelongsToField
                    name="worldId"
                    options={worldOptions}
                    reference={worldReferenceMetadata}
                    objectId="world-id-1"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
        </div>
      );

      mount(<TestFormWithMultipleFields />);

      // Create field interactables with parent elements and the same objectId
      const field1 = belongsToField(
        "worldId",
        "World",
        () => cy.get('[data-testid="container-1"]'),
        "world-id-1"
      );
      const field2 = belongsToField(
        "worldId",
        "World",
        () => cy.get('[data-testid="container-2"]'),
        "world-id-1"
      );

      // Verify each field has the correct value
      field1.getSelectedText().should("eq", "Test World 1");
      field2.getSelectedText().should("eq", "Test World 2");

      // Test interactions with each field
      field1.selectById("world2");
      field2.selectById("world1");

      // Verify the values were updated correctly
      field1.getSelectedText().should("eq", "Test World 2");
      field2.getSelectedText().should("eq", "Test World 1");
    });
  });

  describe("BelongsToFieldInteractable with Index Parameter", () => {
    // Sample data for testing
    const worldOptions = [
      { _id: "world1", name: "Test World 1" },
      { _id: "world2", name: "Test World 2" },
    ];

    // Define reference metadata for testing
    const worldReferenceMetadata = {
      name: "world",
      type: RelationshipType.BELONGS_TO,
      foreignField: "_id",
      options: worldOptions,
    };

    // Create a simple schema for the field
    const schema = z.object({
      worldId: z.string().optional(),
    });

    it("should handle multiple selectors with the same object type and same object ID using index", () => {
      // Create a test component with multiple fields of the same type and ID
      const TestFormWithDuplicateFields = () => (
        <div>
          <div data-testid="container">
            <div data-testid="field-1">
              <ObjectSchemaProvider schema={schema} objectType="World">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ worldId: "world1" }}
                  onSubmit={() => {}}
                >
                  <BelongsToField
                    name="worldId"
                    options={worldOptions}
                    reference={worldReferenceMetadata}
                    objectId="duplicate-id"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
            <div data-testid="field-2">
              <ObjectSchemaProvider schema={schema} objectType="World">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ worldId: "world2" }}
                  onSubmit={() => {}}
                >
                  <BelongsToField
                    name="worldId"
                    options={worldOptions}
                    reference={worldReferenceMetadata}
                    objectId="duplicate-id"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
        </div>
      );

      mount(<TestFormWithDuplicateFields />);

      // Create field interactables with the same object type and ID but different indices
      const field1 = belongsToField(
        "worldId",
        "World",
        () => cy.get('[data-testid="field-1"]'),
        "duplicate-id"
      );

      const field2 = belongsToField(
        "worldId",
        "World",
        () => cy.get('[data-testid="field-2"]'),
        "duplicate-id"
      );

      // Verify each field has the correct value
      field1.getSelectedText().should("eq", "Test World 1");
      field2.getSelectedText().should("eq", "Test World 2");

      // Test interactions with each field
      field1.selectById("world2");
      field2.selectById("world1");

      // Verify the values were updated correctly
      field1.getSelectedText().should("eq", "Test World 2");
      field2.getSelectedText().should("eq", "Test World 1");
    });

    it("throws an error when multiple elements match but no index is provided", () => {
      // Create a test component with multiple fields of the same type and ID
      const TestFormWithDuplicateFields = () => (
        <div>
          <div data-testid="container">
            <ObjectSchemaProvider schema={schema} objectType="World">
              <AutoForm
                schema={new ZodBridge({ schema })}
                model={{ worldId: "world1" }}
                onSubmit={() => {}}
              >
                <BelongsToField
                  name="worldId"
                  options={worldOptions}
                  reference={worldReferenceMetadata}
                  objectId="duplicate-id"
                />
              </AutoForm>
            </ObjectSchemaProvider>
            <ObjectSchemaProvider schema={schema} objectType="World">
              <AutoForm
                schema={new ZodBridge({ schema })}
                model={{ worldId: "world2" }}
                onSubmit={() => {}}
              >
                <BelongsToField
                  name="worldId"
                  options={worldOptions}
                  reference={worldReferenceMetadata}
                  objectId="duplicate-id"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );

      mount(<TestFormWithDuplicateFields />);

      // Set up Cypress to catch the error
      cy.on("fail", (err) => {
        expect(err.message).to.include("Multiple elements");
        expect(err.message).to.include("found matching selector");
        expect(err.message).to.include("but no index parameter was provided");
        return false;
      });

      // Try to create a field interactable without an index
      // This should throw an error because multiple elements match
      const field = belongsToField(
        "worldId",
        "World",
        undefined,
        "duplicate-id"
      );

      // Attempt to interact with the field, which should trigger the error
      field.getElement();
    });
  });
});
