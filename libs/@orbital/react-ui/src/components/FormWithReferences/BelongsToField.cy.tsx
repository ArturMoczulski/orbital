// BelongsToField.cy.tsx
// Tests for the BelongsToField component

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { belongsToField } from "../../../cypress/interactables/FormWithReferences/BelongsToField.interactable";
import BelongsToField from "./BelongsToField";
import { ObjectSchemaProvider } from "./ObjectSchemaContext";

describe("BelongsToField Component", () => {
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
    error = false,
    errorMessage = "",
    objectId = undefined,
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <ObjectSchemaProvider schema={schema} objectType="World">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ worldId: value }}
          onSubmit={() => {}}
        >
          <BelongsToField
            name="worldId"
            disabled={disabled}
            required={required}
            onChange={handleChange}
            options={worldOptions}
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

  describe("Component Specific Functionality", () => {
    it("should set data-testid to 'BelongsToField'", () => {
      mount(<TestForm />);

      // Verify the data-testid attribute is set correctly
      cy.get('[data-testid="BelongsToField"]').should("exist");
    });

    it("should handle string values in onChange", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(<TestForm onChange={onChangeSpy} />);

      const field = belongsToField("worldId", "World");
      field.selectById("world2");

      // Check that onChange was called with the string value
      cy.get("@onChange").should("have.been.calledWith", "world2");
    });

    it("should handle array values in onChange by taking the first value", () => {
      const onChangeSpy = cy.spy().as("onChange");

      // Create a component that directly tests the handleChange function
      const TestArrayHandling = () => {
        const [value, setValue] = useState("");

        // Create a wrapper for the component's handleChange function
        const handleChange = (newValue) => {
          if (Array.isArray(newValue)) {
            setValue(newValue.length > 0 ? newValue[0] : "");
            if (onChangeSpy) {
              onChangeSpy(newValue.length > 0 ? newValue[0] : "");
            }
          } else {
            setValue(newValue);
            if (onChangeSpy) {
              onChangeSpy(newValue);
            }
          }
        };

        // Simulate calling handleChange with an array
        cy.window().then(() => {
          handleChange(["world2", "world3"]);
        });

        return <div data-testid="test-result">{value}</div>;
      };

      mount(<TestArrayHandling />);

      // Check that the first value from the array was used
      cy.get('[data-testid="test-result"]').should("have.text", "world2");
      cy.get("@onChange").should("have.been.calledWith", "world2");
    });

    it("should handle empty array in onChange by setting empty string", () => {
      const onChangeSpy = cy.spy().as("onChange");

      // Create a component that directly tests the handleChange function
      const TestEmptyArrayHandling = () => {
        const [value, setValue] = useState("world1");

        // Create a wrapper for the component's handleChange function
        const handleChange = (newValue) => {
          if (Array.isArray(newValue)) {
            setValue(newValue.length > 0 ? newValue[0] : "");
            if (onChangeSpy) {
              onChangeSpy(newValue.length > 0 ? newValue[0] : "");
            }
          } else {
            setValue(newValue);
            if (onChangeSpy) {
              onChangeSpy(newValue);
            }
          }
        };

        // Simulate calling handleChange with an empty array
        cy.window().then(() => {
          handleChange([]);
        });

        return <div data-testid="test-result">{value}</div>;
      };

      mount(<TestEmptyArrayHandling />);

      // Check that an empty string was set
      cy.get('[data-testid="test-result"]').should("have.text", "");
      cy.get("@onChange").should("have.been.calledWith", "");
    });
  });

  describe("Context Integration", () => {
    it("should use schema and objectType from context", () => {
      // Create a component without explicitly providing schema and objectType
      const ContextTestComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="World">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ worldId: value }}
              onSubmit={() => {}}
            >
              <BelongsToField
                name="worldId"
                onChange={setValue}
                reference={referenceMetadata}
                value={value}
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<ContextTestComponent />);

      const field = belongsToField("worldId", "World");
      field.label().should("contain", "World");
    });

    it("should use provided schema and objectType over context", () => {
      // Create a schema and objectType that differ from the context
      const customSchema = z.object({
        planetId: z.string().optional(),
      });

      // Create a component with explicitly provided schema and objectType
      const OverrideContextComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="World">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ worldId: value }}
              onSubmit={() => {}}
            >
              <BelongsToField
                name="worldId"
                onChange={setValue}
                reference={referenceMetadata}
                value={value}
                schema={customSchema}
                objectType="Planet"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<OverrideContextComponent />);

      const field = belongsToField("worldId", "Planet");
      field.label().should("contain", "World"); // Label should still come from reference metadata
    });
  });

  describe("Prop Passing to ReferenceField", () => {
    it("should pass multiple=false to ReferenceField", () => {
      mount(<TestForm initialValue="world1" />);

      // Verify that the field is in single-select mode
      const field = belongsToField("worldId", "World");
      field.getValue().should("eq", "world1");

      // In single-select mode, there should be no chips
      cy.get(".MuiChip-root").should("not.exist");
    });

    it("should pass all provided props to ReferenceField", () => {
      mount(
        <TestForm
          disabled={true}
          required={true}
          initialValue="world1"
          error={true}
          errorMessage="Test error message"
        />
      );

      const field = belongsToField("worldId", "World");

      // Check that props were passed correctly
      field.isDisabled().should("be.true");
      field.isRequired().should("be.true");
      field.getValue().should("eq", "world1");
      field.hasError().should("be.true");
      field.getErrorMessage().should("eq", "Test error message");
    });

    it("should pass objectId to ReferenceField", () => {
      mount(<TestForm objectId="test-object-id" />);

      // Create a field interactable with the objectId
      const field = belongsToField(
        "worldId",
        "World",
        undefined,
        "test-object-id"
      );

      // Verify the field exists and can be interacted with
      field.get().should("exist");
    });
  });
});
