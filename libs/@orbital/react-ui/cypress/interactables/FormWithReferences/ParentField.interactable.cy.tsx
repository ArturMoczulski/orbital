// ParentField.interactable.cy.tsx
// Tests for the ParentField interactable

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { ObjectSchemaProvider } from "../../../src/components/FormWithReferences/ObjectSchemaContext";
import ParentField from "../../../src/components/FormWithReferences/ParentField";
import { parentField } from "./ParentField.interactable";

describe("ParentField.interactable", () => {
  // Sample data for testing - tree nodes with parent-child relationships
  const nodeOptions = [
    { _id: "node1", name: "Root Node" },
    { _id: "node2", name: "Child Node 1" },
    { _id: "node3", name: "Child Node 2" },
    { _id: "node4", name: "Grandchild Node" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "node",
    type: RelationshipType.RECURSIVE,
    foreignField: "_id",
    options: nodeOptions,
  };

  // Create schema for parent field
  const schema = z.object({
    parentId: z.string().optional(),
  });

  // Test component for ParentField
  const TestForm = ({
    disabled = false,
    required = false,
    initialValue = "",
    onChange = undefined,
    currentNodeId = undefined, // ID of the current node to filter out from options
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string;
    onChange?: (value: string) => void;
    currentNodeId?: string;
  }) => {
    const [value, setValue] = useState(initialValue);

    // Create a modified schema based on the required prop
    const formSchema = required
      ? z.object({
          parentId: z.string(),
        })
      : schema;

    const handleChange = (newValue: string) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    // Filter options to remove the current node if specified
    const filteredOptions = currentNodeId
      ? nodeOptions.filter((node) => node._id !== currentNodeId)
      : nodeOptions;

    return (
      <ObjectSchemaProvider schema={formSchema} objectType="Node">
        <AutoForm
          schema={new ZodBridge({ schema: formSchema })}
          model={{ parentId: value }}
          onSubmit={() => {}}
        >
          <ParentField
            name="parentId"
            disabled={disabled}
            required={required}
            options={filteredOptions}
            onChange={handleChange}
            reference={{
              ...referenceMetadata,
              options: filteredOptions,
            }}
            currentId={currentNodeId}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  it("should select a value", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm onChange={onChangeSpy} />);

    const field = parentField("parentId", "Node");

    field.selectById("node2");

    cy.get("@onChange").should("have.been.calledWith", "node2");
    field.getValue().should("eq", "node2");
    field.getSelectedText().should("eq", "Child Node 1");
  });

  it("should handle disabled state", () => {
    mount(<TestForm disabled={true} initialValue="node1" />);

    const field = parentField("parentId", "Node");

    field.isDisabled().should("be.true");
    field.getValue().should("eq", "node1");
    field.getSelectedText().should("eq", "Root Node");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestForm required={true} />);

    const field = parentField("parentId", "Node");

    field.isRequired().should("be.true");
  });

  it("should clear selection", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm initialValue="node1" onChange={onChangeSpy} />);

    const field = parentField("parentId", "Node");

    field.getValue().should("eq", "node1");
    field.getSelectedText().should("eq", "Root Node");

    field.clear();

    cy.get("@onChange").should("have.been.calledWith", "");
    field.getValue().should("eq", "");
  });

  it("should filter out the current node from options", () => {
    // Mount with currentNodeId to simulate filtering out the current node
    mount(<TestForm currentNodeId="node1" />);

    const field = parentField("parentId", "Node");

    // Open the dropdown and verify node1 is not in the options
    field.openDropdown();

    // Check that "Root Node" is not in the options
    field.getItems().then((items) => {
      const hasRootNode = items.some((item) => item.getName() === "Root Node");
      expect(hasRootNode).to.be.false;
    });

    // But other nodes should be present
    field.getItemByName("Child Node 1").should("not.be.undefined");
  });

  it("should handle empty reference options gracefully", () => {
    // Create a test component with no options
    const TestFormNoOptions = () => (
      <ObjectSchemaProvider schema={schema} objectType="Node">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ parentId: "" }}
          onSubmit={() => {}}
        >
          <ParentField
            name="parentId"
            reference={{
              ...referenceMetadata,
              options: [],
            }}
            currentId=""
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );

    mount(<TestFormNoOptions />);

    const field = parentField("parentId", "Node");

    // Field should be disabled when no options are available
    field.isDisabled().should("be.true");
    field.getErrorMessage().should("eq", "No options available");
  });

  it("should scope to parent element", () => {
    // Create a test component with two identical fields
    const TestFormWithMultipleFields = () => (
      <div>
        <div data-testid="first-container">
          <ObjectSchemaProvider schema={schema} objectType="Node">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ parentId: "node1" }}
              onSubmit={() => {}}
            >
              <ParentField
                name="parentId"
                options={nodeOptions}
                reference={referenceMetadata}
                currentId=""
              />
            </AutoForm>
          </ObjectSchemaProvider>
        </div>
        <div data-testid="second-container">
          <ObjectSchemaProvider schema={schema} objectType="Node">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ parentId: "node2" }}
              onSubmit={() => {}}
            >
              <ParentField
                name="parentId"
                options={nodeOptions}
                reference={referenceMetadata}
                currentId=""
              />
            </AutoForm>
          </ObjectSchemaProvider>
        </div>
      </div>
    );

    mount(<TestFormWithMultipleFields />);

    // Create field interactables with different parent elements
    const firstField = parentField("parentId", "Node", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = parentField("parentId", "Node", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct value
    firstField.getSelectedText().should("eq", "Root Node");
    secondField.getSelectedText().should("eq", "Child Node 1");
  });

  it("should handle error state", () => {
    // Mount a basic form first
    mount(
      <ObjectSchemaProvider schema={schema} objectType="Node">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ parentId: "node1" }}
          onSubmit={() => {}}
        >
          <ParentField
            name="parentId"
            options={nodeOptions}
            reference={referenceMetadata}
            currentId=""
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );

    const field = parentField("parentId", "Node");

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
        errorMessage.textContent = "Invalid parent node";
        $el.append(errorMessage);

        // Now check error state
        field.hasError().should("be.true");
        field.getErrorMessage().should("eq", "Invalid parent node");
      });
  });
});
