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
});
