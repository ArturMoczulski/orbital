// ChildrenField.interactable.cy.tsx
// Tests for the ChildrenField interactable

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import ChildrenField from "../../../src/components/FormWithReferences/ChildrenField";
import { ObjectSchemaProvider } from "../../../src/components/FormWithReferences/ObjectSchemaContext";
import { childrenField } from "./ChildrenField.interactable";

describe("ChildrenField.interactable", () => {
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

  // Create schema for children field
  const schema = z.object({
    childrenIds: z.array(z.string()).optional(),
  });

  // Test component for ChildrenField
  const TestForm = ({
    disabled = false,
    required = false,
    initialValue = [],
    onChange = undefined,
    currentNodeId = undefined, // ID of the current node to filter out from options
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string[];
    onChange?: (value: string[]) => void;
    currentNodeId?: string;
  }) => {
    const [value, setValue] = useState(initialValue);

    // Create a modified schema based on the required prop
    const formSchema = required
      ? z.object({
          childrenIds: z.array(z.string()).min(1),
        })
      : schema;

    const handleChange = (newValue: string[]) => {
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
          model={{ childrenIds: value }}
          onSubmit={() => {}}
        >
          <ChildrenField
            name="childrenIds"
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

  it("should select multiple values", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm onChange={onChangeSpy} />);

    const field = childrenField("childrenIds", "Node");

    field.selectById(["node2", "node3"]);

    cy.get("@onChange").should("have.been.calledWith", ["node2", "node3"]);
    field.getSelectedValues().should("deep.equal", ["node2", "node3"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 2");
  });

  it("should handle disabled state", () => {
    mount(<TestForm disabled={true} initialValue={["node1", "node2"]} />);

    const field = childrenField("childrenIds", "Node");

    field.isDisabled().should("be.true");
    field.getSelectedValues().should("deep.equal", ["node1", "node2"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Root Node");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestForm required={true} />);

    const field = childrenField("childrenIds", "Node");

    field.isRequired().should("be.true");
  });

  it("should clear selections", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(
      <TestForm initialValue={["node1", "node2"]} onChange={onChangeSpy} />
    );

    const field = childrenField("childrenIds", "Node");

    field.getSelectedValues().should("deep.equal", ["node1", "node2"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Root Node");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1");

    // Use clear method to clear selections
    field.clear();

    cy.get("@onChange").should("have.been.calledWith", []);
    field.getSelectedValues().should("deep.equal", []);
  });

  it("should filter out the current node from options", () => {
    // Mount with currentNodeId to simulate filtering out the current node
    mount(<TestForm currentNodeId="node1" />);

    const field = childrenField("childrenIds", "Node");

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
          model={{ childrenIds: [] }}
          onSubmit={() => {}}
        >
          <ChildrenField
            name="childrenIds"
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

    const field = childrenField("childrenIds", "Node");

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
              model={{ childrenIds: ["node1", "node2"] }}
              onSubmit={() => {}}
            >
              <ChildrenField
                name="childrenIds"
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
              model={{ childrenIds: ["node3", "node4"] }}
              onSubmit={() => {}}
            >
              <ChildrenField
                name="childrenIds"
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
    const firstField = childrenField("childrenIds", "Node", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = childrenField("childrenIds", "Node", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct values
    firstField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Root Node")
      .should("contain.text", "Child Node 1");

    secondField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 2")
      .should("contain.text", "Grandchild Node");
  });

  it("should handle error state", () => {
    // Mount a basic form first
    mount(
      <ObjectSchemaProvider schema={schema} objectType="Node">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ childrenIds: ["node1", "node2"] }}
          onSubmit={() => {}}
        >
          <ChildrenField
            name="childrenIds"
            options={nodeOptions}
            reference={referenceMetadata}
            currentId=""
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );

    const field = childrenField("childrenIds", "Node");

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
        errorMessage.textContent = "Invalid child nodes";
        $el.append(errorMessage);

        // Now check error state
        field.hasError().should("be.true");
        field.getErrorMessage().should("eq", "Invalid child nodes");
      });
  });
});
