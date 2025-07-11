/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { OnChange } from "uniforms";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import BelongsToField from "../../../src/components/FormWithReferences/BelongsToField";
import { ObjectSchemaProvider } from "../../../src/components/FormWithReferences/ObjectSchemaContext";
import { belongsToField } from "./BelongsToField.interactable";

// Create a simple schema for the field
const schema = z.object({
  worldId: z.string().optional(),
  areaId: z.string().optional(),
});

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
    schema: schema,
  };

  const TestForm = ({
    disabled = false,
    required = false,
    initialValue = "",
    onChange = undefined,
    error = false,
    errorMessage = "",
    objectId = undefined,
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string;
    onChange?: (value: string) => void;
    error?: boolean;
    errorMessage?: string;
    objectId?: string;
  }) => {
    const [value, setValue] = useState(initialValue);

    // Create a modified schema based on the required prop
    const formSchema = required
      ? z.object({
          worldId: z.string(),
        })
      : schema;

    const handleChange: OnChange<string | undefined> = (value) => {
      const stringValue = typeof value === "string" ? value : "";
      setValue(stringValue);
      if (onChange) {
        onChange(stringValue);
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
            onChange={handleChange}
            reference={referenceMetadata}
            value={value}
            error={error}
            errorMessage={errorMessage}
            objectId={objectId}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  it("should select a value", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm onChange={onChangeSpy} />);

    const field = belongsToField("worldId", "World");

    // Try selecting by visible text instead of ID
    field.select("Test World 2");

    cy.get("@onChange").should("have.been.calledWith", "world2");
    field.getValue().should("eq", "Test World 2");
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

    field.getValue().should("eq", "Test World 1");

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

    // Use getError() instead of getErrorMessage() to avoid the .MuiFormControl-root selector issue
    field.getError().should("eq", "No options available");
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
                reference={{
                  ...referenceMetadata,
                }}
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
                reference={{
                  ...referenceMetadata,
                }}
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
    firstField.getValue().should("eq", "Test World 1");
    secondField.getValue().should("eq", "Test World 2");
  });

  it("should handle error state", () => {
    mount(<TestForm error={true} errorMessage="Invalid world" />);

    const field = belongsToField("worldId", "World");

    field.hasError().should("be.true");
    // Use getError() instead of getErrorMessage() to avoid the .MuiFormControl-root selector issue
    field.getError().should("eq", "Invalid world");
  });
});
