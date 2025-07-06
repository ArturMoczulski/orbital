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

describe("Multiple ChildrenFields on the same page", () => {
  // Sample data for testing - tree nodes with parent-child relationships
  const nodeOptions = [
    { _id: "node1", name: "Root Node" },
    { _id: "node2", name: "Child Node 1" },
    { _id: "node3", name: "Child Node 2" },
    { _id: "node4", name: "Grandchild Node" },
  ];

  const areaOptions = [
    { _id: "area1", name: "Main Area" },
    { _id: "area2", name: "Sub Area 1" },
    { _id: "area3", name: "Sub Area 2" },
  ];

  // Define reference metadata for testing
  const nodeReferenceMetadata = {
    name: "node",
    type: RelationshipType.RECURSIVE,
    foreignField: "_id",
    options: nodeOptions,
  };

  const areaReferenceMetadata = {
    name: "area",
    type: RelationshipType.RECURSIVE,
    foreignField: "_id",
    options: areaOptions,
  };

  it("should handle same object type but different IDs", () => {
    // Create a test component with two fields of the same object type but different IDs
    const TestFormWithSameTypeFields = () => {
      const [node1Children, setNode1Children] = useState(["node2", "node3"]);
      const [node2Children, setNode2Children] = useState(["node4"]);

      return (
        <div>
          <div data-testid="node1-container">
            <ObjectSchemaProvider
              schema={z.object({
                childrenIds: z.array(z.string()).optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      childrenIds: z.array(z.string()).optional(),
                    }),
                  })
                }
                model={{ childrenIds: node1Children }}
                onSubmit={() => {}}
              >
                <ChildrenField
                  name="childrenIds"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="node-1"
                  onChange={(newValue) => setNode1Children(newValue)}
                  currentId="node1"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
          <div data-testid="node2-container">
            <ObjectSchemaProvider
              schema={z.object({
                childrenIds: z.array(z.string()).optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      childrenIds: z.array(z.string()).optional(),
                    }),
                  })
                }
                model={{ childrenIds: node2Children }}
                onSubmit={() => {}}
              >
                <ChildrenField
                  name="childrenIds"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="node-2"
                  onChange={(newValue) => setNode2Children(newValue)}
                  currentId="node2"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );
    };

    mount(<TestFormWithSameTypeFields />);

    // Create parent-scoped interactables for each container
    const node1Container = () => cy.get('[data-testid="node1-container"]');
    const node2Container = () => cy.get('[data-testid="node2-container"]');

    // Create field interactables with the same object type but different IDs
    const node1Field = childrenField(
      "childrenIds",
      "Node",
      node1Container,
      "node-1"
    );
    const node2Field = childrenField(
      "childrenIds",
      "Node",
      node2Container,
      "node-2"
    );

    // Verify each field has the correct values
    cy.wait(100); // Wait for the component to fully render

    // Check first field
    node1Field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1")
      .should("contain.text", "Child Node 2");

    // Check second field
    node2Field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Grandchild Node");

    // Test interactions with each field
    node1Field.selectById(["node4"]);
    node2Field.selectById(["node3"]);

    // Verify the values were updated correctly
    node1Field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Grandchild Node")
      .should("not.contain.text", "Child Node 1")
      .should("not.contain.text", "Child Node 2");

    node2Field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 2")
      .should("not.contain.text", "Grandchild Node");
  });

  it("should handle different object types but same IDs", () => {
    // Create a schema for the area field
    const areaSchema = z.object({
      childrenIds: z.array(z.string()).optional(),
    });

    // Create a test component with fields of different object types but same IDs
    const TestFormWithDifferentTypeFields = () => {
      const [nodeChildren, setNodeChildren] = useState(["node2", "node3"]);
      const [areaChildren, setAreaChildren] = useState(["area2", "area3"]);

      return (
        <div>
          <div data-testid="node-container">
            <ObjectSchemaProvider
              schema={z.object({
                childrenIds: z.array(z.string()).optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      childrenIds: z.array(z.string()).optional(),
                    }),
                  })
                }
                model={{ childrenIds: nodeChildren }}
                onSubmit={() => {}}
              >
                <ChildrenField
                  name="childrenIds"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="shared-id-123"
                  onChange={(newValue) => setNodeChildren(newValue)}
                  currentId="node1"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
          <div data-testid="area-container">
            <ObjectSchemaProvider schema={areaSchema} objectType="Area">
              <AutoForm
                schema={new ZodBridge({ schema: areaSchema })}
                model={{ childrenIds: areaChildren }}
                onSubmit={() => {}}
              >
                <ChildrenField
                  name="childrenIds"
                  options={areaOptions}
                  reference={areaReferenceMetadata}
                  objectId="shared-id-123"
                  onChange={(newValue) => setAreaChildren(newValue)}
                  currentId="area1"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );
    };

    mount(<TestFormWithDifferentTypeFields />);

    // Create parent-scoped interactables for each container
    const nodeContainer = () => cy.get('[data-testid="node-container"]');
    const areaContainer = () => cy.get('[data-testid="area-container"]');

    // Create field interactables with different object types but the same ID
    const nodeField = childrenField(
      "childrenIds",
      "Node",
      nodeContainer,
      "shared-id-123"
    );
    const areaField = childrenField(
      "childrenIds",
      "Area",
      areaContainer,
      "shared-id-123"
    );

    // Verify each field has the correct values
    cy.wait(100); // Wait for the component to fully render

    // Check node field
    nodeField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1")
      .should("contain.text", "Child Node 2");

    // Check area field
    areaField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Sub Area 1")
      .should("contain.text", "Sub Area 2");

    // Test interactions with each field
    nodeField.selectById(["node4"]);
    areaField.selectById(["area2"]);

    // Verify the values were updated correctly
    nodeField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Grandchild Node")
      .should("not.contain.text", "Child Node 1")
      .should("not.contain.text", "Child Node 2");

    areaField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Sub Area 1")
      .should("not.contain.text", "Sub Area 2");
  });

  it("should handle parent element and objectId together", () => {
    // Create a test component with multiple fields of the same type and ID
    const TestFormWithMultipleFields = () => {
      const [node1Children, setNode1Children] = useState(["node2", "node3"]);
      const [node2Children, setNode2Children] = useState(["node4"]);

      return (
        <div>
          <div data-testid="container-1">
            <div data-testid="node-1">
              <ObjectSchemaProvider
                schema={z.object({
                  childrenIds: z.array(z.string()).optional(),
                })}
                objectType="Node"
              >
                <AutoForm
                  schema={
                    new ZodBridge({
                      schema: z.object({
                        childrenIds: z.array(z.string()).optional(),
                      }),
                    })
                  }
                  model={{ childrenIds: node1Children }}
                  onSubmit={() => {}}
                >
                  <ChildrenField
                    name="childrenIds"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="node-id-1"
                    onChange={(newValue) => setNode1Children(newValue)}
                    currentId="node1"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
          <div data-testid="container-2">
            <div data-testid="node-1">
              <ObjectSchemaProvider
                schema={z.object({
                  childrenIds: z.array(z.string()).optional(),
                })}
                objectType="Node"
              >
                <AutoForm
                  schema={
                    new ZodBridge({
                      schema: z.object({
                        childrenIds: z.array(z.string()).optional(),
                      }),
                    })
                  }
                  model={{ childrenIds: node2Children }}
                  onSubmit={() => {}}
                >
                  <ChildrenField
                    name="childrenIds"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="node-id-1"
                    onChange={(newValue) => setNode2Children(newValue)}
                    currentId="node2"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
        </div>
      );
    };

    mount(<TestFormWithMultipleFields />);

    // Create field interactables with parent elements and the same objectId
    const field1 = childrenField(
      "childrenIds",
      "Node",
      () => cy.get('[data-testid="container-1"]'),
      "node-id-1"
    );
    const field2 = childrenField(
      "childrenIds",
      "Node",
      () => cy.get('[data-testid="container-2"]'),
      "node-id-1"
    );

    // Verify each field has the correct values
    cy.wait(100); // Wait for the component to fully render

    // Check first field
    field1
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1")
      .should("contain.text", "Child Node 2");

    // Check second field
    field2
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Grandchild Node");

    // Test interactions with each field
    field1.selectById(["node4"]);
    field2.selectById(["node3"]);

    // Verify the values were updated correctly
    field1
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Grandchild Node")
      .should("not.contain.text", "Child Node 1")
      .should("not.contain.text", "Child Node 2");

    field2
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 2")
      .should("not.contain.text", "Grandchild Node");
  });

  it("should handle multiple selectors with the same object type and same object ID using index", () => {
    // Create a test component with multiple fields of the same type and ID
    const TestFormWithDuplicateFields = () => {
      const [field1Value, setField1Value] = useState(["node2"]);
      const [field2Value, setField2Value] = useState(["node3"]);

      return (
        <div>
          <div data-testid="duplicate-container">
            <ObjectSchemaProvider
              schema={z.object({
                childrenIds: z.array(z.string()).optional(),
              })}
              objectType="Node"
            >
              <div data-testid="field-1">
                <AutoForm
                  schema={
                    new ZodBridge({
                      schema: z.object({
                        childrenIds: z.array(z.string()).optional(),
                      }),
                    })
                  }
                  model={{ childrenIds: field1Value }}
                  onSubmit={() => {}}
                >
                  <ChildrenField
                    name="childrenIds"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="duplicate-id"
                    onChange={(newValue) => setField1Value(newValue)}
                    currentId="node1"
                  />
                </AutoForm>
              </div>
              <div data-testid="field-2">
                <AutoForm
                  schema={
                    new ZodBridge({
                      schema: z.object({
                        childrenIds: z.array(z.string()).optional(),
                      }),
                    })
                  }
                  model={{ childrenIds: field2Value }}
                  onSubmit={() => {}}
                >
                  <ChildrenField
                    name="childrenIds"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="duplicate-id"
                    onChange={(newValue) => setField2Value(newValue)}
                    currentId="node1"
                  />
                </AutoForm>
              </div>
            </ObjectSchemaProvider>
          </div>
        </div>
      );
    };

    mount(<TestFormWithDuplicateFields />);

    // Create field interactables with the same object type and ID but different indices
    const field1 = childrenField(
      "childrenIds",
      "Node",
      () => cy.get('[data-testid="field-1"]'),
      "duplicate-id",
      0
    );
    const field2 = childrenField(
      "childrenIds",
      "Node",
      () => cy.get('[data-testid="field-2"]'),
      "duplicate-id",
      0
    );

    // Verify each field has the correct values
    field1
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1");

    field2
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 2");

    // Test interactions with each field
    field1.selectById(["node4"]);
    field2.selectById(["node2"]);

    // Verify the values were updated correctly
    field1
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Grandchild Node")
      .should("not.contain.text", "Child Node 1");

    field2
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Child Node 1")
      .should("not.contain.text", "Child Node 2");
  });

  it("throws an error when multiple elements match but no index is provided", () => {
    // Create a test component with multiple fields of the same type and ID
    const TestFormWithDuplicateFields = () => (
      <div>
        <div data-testid="duplicate-container">
          <ObjectSchemaProvider
            schema={z.object({
              childrenIds: z.array(z.string()).optional(),
            })}
            objectType="Node"
          >
            <div data-testid="field-container">
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      childrenIds: z.array(z.string()).optional(),
                    }),
                  })
                }
                model={{ childrenIds: ["node2"] }}
                onSubmit={() => {}}
              >
                <ChildrenField
                  name="childrenIds"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="duplicate-id"
                  currentId="node1"
                />
              </AutoForm>
            </div>
            <div>
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      childrenIds: z.array(z.string()).optional(),
                    }),
                  })
                }
                model={{ childrenIds: ["node3"] }}
                onSubmit={() => {}}
              >
                <ChildrenField
                  name="childrenIds"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="duplicate-id"
                  currentId="node1"
                />
              </AutoForm>
            </div>
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
    const field = childrenField(
      "childrenIds",
      "Node",
      undefined,
      "duplicate-id"
    );

    // Attempt to interact with the field, which should trigger the error
    field.getElement();
  });
});
