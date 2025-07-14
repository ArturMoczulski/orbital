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
import { ObjectSchemaProvider } from "../../../src/components/ObjectForm/ObjectSchemaContext";
import ParentField from "../../../src/components/ObjectForm/ParentField";
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
    console.log(`TetForm, current node id`, currentNodeId);
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
            options={nodeOptions}
            onChange={handleChange}
            reference={{
              ...referenceMetadata,
              options: nodeOptions,
            }}
            currentId={currentNodeId}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  it("should select a value", () => {
    const onChangeSpy = cy.spy().as("onChange");

    // Explicitly set currentNodeId to null to prevent filtering
    mount(<TestForm onChange={onChangeSpy} currentNodeId={null} />);

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

    field.selectById("node2");

    cy.get("@onChange").should("have.been.calledWith", "node2");
    field.getValue().should("eq", "node2");
    field.getSelectedText().should("eq", "Child Node 1");
  });

  it("should handle disabled state", () => {
    mount(<TestForm disabled={true} initialValue="node1" />);

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

    field.isDisabled().should("be.true");
    field.getValue().should("eq", "node1");
    field.getSelectedText().should("eq", "Root Node");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestForm required={true} />);

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

    field.isRequired().should("be.true");
  });

  it("should clear selection", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm initialValue="node1" onChange={onChangeSpy} />);

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

    field.getValue().should("eq", "node1");
    field.getSelectedText().should("eq", "Root Node");

    field.clear();

    cy.get("@onChange").should("have.been.calledWith", "");
    field.getValue().should("eq", "");
  });

  it("should filter out the current node from options", () => {
    // Mount with currentNodeId and matching initialValue to simulate filtering out the current node
    mount(<TestForm currentNodeId="node1" initialValue="node1" />);

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

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

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

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
    const firstField = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: () => cy.get('[data-testid="first-container"]'),
    });

    const secondField = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: () => cy.get('[data-testid="second-container"]'),
    });

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

    const field = parentField({
      fieldName: "parentId",
      objectType: "Node",
    });

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

describe("Multiple ParentFields on the same page", () => {
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
      const [node1Parent, setNode1Parent] = useState("node1");
      const [node2Parent, setNode2Parent] = useState("node2");

      return (
        <div>
          <div data-testid="node1-container">
            <ObjectSchemaProvider
              schema={z.object({
                parentId: z.string().optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      parentId: z.string().optional(),
                    }),
                  })
                }
                model={{ parentId: node1Parent }}
                onSubmit={() => {}}
              >
                <ParentField
                  name="parentId"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="node-1"
                  onChange={(newValue) => setNode1Parent(newValue)}
                  currentId="node3"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
          <div data-testid="node2-container">
            <ObjectSchemaProvider
              schema={z.object({
                parentId: z.string().optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      parentId: z.string().optional(),
                    }),
                  })
                }
                model={{ parentId: node2Parent }}
                onSubmit={() => {}}
              >
                <ParentField
                  name="parentId"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="node-2"
                  onChange={(newValue) => setNode2Parent(newValue)}
                  currentId="node4"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );
    };

    mount(<TestFormWithSameTypeFields />);

    // Debug: Check if the containers exist
    cy.get('[data-testid="node1-container"]').should("exist");
    cy.get('[data-testid="node2-container"]').should("exist");

    // Debug: Log the HTML of the containers to see what's actually being rendered
    cy.get('[data-testid="node1-container"]').then(($el) => {
      cy.log("node1-container HTML:");
      cy.log($el.html());
    });

    // Check what ParentField elements actually exist
    cy.get('[data-testid="ParentField"]').then(($elements) => {
      cy.log(`Found ${$elements.length} ParentField elements`);
      $elements.each((i, el) => {
        const $el = Cypress.$(el);
        cy.log(`Element ${i}:`);
        cy.log(`data-field-name: ${$el.attr("data-field-name")}`);
        cy.log(`data-object-id: ${$el.attr("data-object-id")}`);
        cy.log(`data-testid: ${$el.attr("data-testid")}`);
      });
    });

    // Create parent-scoped interactables for each container
    const node1Container = () => cy.get('[data-testid="node1-container"]');
    const node2Container = () => cy.get('[data-testid="node2-container"]');

    // Create field interactables with the same object type but different IDs
    const node1Field = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: node1Container,
      objectId: "node-1",
    });
    const node2Field = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: node2Container,
      objectId: "node-2",
    });

    // Verify each field has the correct value
    node1Field.getSelectedText().should("eq", "Root Node");
    node2Field.getSelectedText().should("eq", "Child Node 1");

    // Test interactions with each field
    node1Field.selectById("node2");
    node2Field.selectById("node1");

    // Verify the values were updated correctly
    node1Field.getSelectedText().should("eq", "Child Node 1");
    node2Field.getSelectedText().should("eq", "Root Node");
  });

  it("should handle different object types but same IDs", () => {
    // Create a schema for the area field
    const areaSchema = z.object({
      parentId: z.string().optional(),
    });

    // Create a test component with fields of different object types but same IDs
    const TestFormWithDifferentTypeFields = () => {
      const [nodeParent, setNodeParent] = useState("node1");
      const [areaParent, setAreaParent] = useState("area1");

      return (
        <div>
          <div data-testid="node-container">
            <ObjectSchemaProvider
              schema={z.object({
                parentId: z.string().optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      parentId: z.string().optional(),
                    }),
                  })
                }
                model={{ parentId: nodeParent }}
                onSubmit={() => {}}
              >
                <ParentField
                  name="parentId"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="shared-id-123"
                  onChange={(newValue) => setNodeParent(newValue)}
                  currentId="node3"
                />
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
          <div data-testid="area-container">
            <ObjectSchemaProvider schema={areaSchema} objectType="Area">
              <AutoForm
                schema={new ZodBridge({ schema: areaSchema })}
                model={{ parentId: areaParent }}
                onSubmit={() => {}}
              >
                <ParentField
                  name="parentId"
                  options={areaOptions}
                  reference={areaReferenceMetadata}
                  objectId="shared-id-123"
                  onChange={(newValue) => setAreaParent(newValue)}
                  currentId="area3"
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
    const nodeField = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: nodeContainer,
      objectId: "shared-id-123",
    });
    const areaField = parentField({
      fieldName: "parentId",
      objectType: "Area",
      parentElement: areaContainer,
      objectId: "shared-id-123",
    });

    // Verify each field has the correct value
    nodeField.getSelectedText().should("eq", "Root Node");
    areaField.getSelectedText().should("eq", "Main Area");

    // Test interactions with each field
    nodeField.selectById("node2");
    areaField.selectById("area2");

    // Verify the values were updated correctly
    nodeField.getSelectedText().should("eq", "Child Node 1");
    areaField.getSelectedText().should("eq", "Sub Area 1");
  });

  it("should handle parent element and objectId together", () => {
    // Create a test component with multiple fields of the same type and ID
    const TestFormWithMultipleFields = () => {
      const [node1Parent, setNode1Parent] = useState("node1");
      const [node2Parent, setNode2Parent] = useState("node2");

      return (
        <div>
          <div data-testid="container-1">
            <div data-testid="node-1">
              <ObjectSchemaProvider
                schema={z.object({
                  parentId: z.string().optional(),
                })}
                objectType="Node"
              >
                <AutoForm
                  schema={
                    new ZodBridge({
                      schema: z.object({
                        parentId: z.string().optional(),
                      }),
                    })
                  }
                  model={{ parentId: node1Parent }}
                  onSubmit={() => {}}
                >
                  <ParentField
                    name="parentId"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="node-id-1"
                    onChange={(newValue) => setNode1Parent(newValue)}
                    currentId="node3"
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
          <div data-testid="container-2">
            <div data-testid="node-1">
              <ObjectSchemaProvider
                schema={z.object({
                  parentId: z.string().optional(),
                })}
                objectType="Node"
              >
                <AutoForm
                  schema={
                    new ZodBridge({
                      schema: z.object({
                        parentId: z.string().optional(),
                      }),
                    })
                  }
                  model={{ parentId: node2Parent }}
                  onSubmit={() => {}}
                >
                  <ParentField
                    name="parentId"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="node-id-1"
                    onChange={(newValue) => setNode2Parent(newValue)}
                    currentId="node4"
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
    const field1 = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: () => cy.get('[data-testid="container-1"]'),
      objectId: "node-id-1",
    });
    const field2 = parentField({
      fieldName: "parentId",
      objectType: "Node",
      parentElement: () => cy.get('[data-testid="container-2"]'),
      objectId: "node-id-1",
    });

    // Verify each field has the correct value
    field1.getSelectedText().should("eq", "Root Node");
    field2.getSelectedText().should("eq", "Child Node 1");

    // Test interactions with each field
    field1.selectById("node2");
    field2.selectById("node1");

    // Verify the values were updated correctly
    field1.getSelectedText().should("eq", "Child Node 1");
    field2.getSelectedText().should("eq", "Root Node");
  });

  it("should handle multiple selectors with the same object type and same object ID using index", () => {
    // Create a test component with multiple fields of the same type and ID
    const TestFormWithDuplicateFields = () => {
      const [field1Value, setField1Value] = useState("node1");
      const [field2Value, setField2Value] = useState("node2");

      return (
        <div>
          <div data-testid="duplicate-container">
            <ObjectSchemaProvider
              schema={z.object({
                parentId1: z.string().optional(),
                parentId2: z.string().optional(),
              })}
              objectType="Node"
            >
              <AutoForm
                schema={
                  new ZodBridge({
                    schema: z.object({
                      parentId1: z.string().optional(),
                      parentId2: z.string().optional(),
                    }),
                  })
                }
                model={{ parentId1: field1Value, parentId2: field2Value }}
                onSubmit={() => {}}
              >
                <div data-testid="field-1">
                  <ParentField
                    name="parentId1"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="duplicate-id"
                    onChange={(newValue) => setField1Value(newValue)}
                    currentId="node3"
                  />
                </div>
                <div data-testid="field-2">
                  <ParentField
                    name="parentId2"
                    options={nodeOptions}
                    reference={nodeReferenceMetadata}
                    objectId="duplicate-id"
                    onChange={(newValue) => setField2Value(newValue)}
                    currentId="node4"
                  />
                </div>
              </AutoForm>
            </ObjectSchemaProvider>
          </div>
        </div>
      );
    };

    mount(<TestFormWithDuplicateFields />);

    // Create field interactables with the same object type and ID but using parent elements to scope
    const field1 = parentField({
      fieldName: "parentId1",
      objectType: "Node",
      parentElement: () => cy.get('[data-testid="field-1"]'),
      objectId: "duplicate-id",
    });
    const field2 = parentField({
      fieldName: "parentId2",
      objectType: "Node",
      parentElement: () => cy.get('[data-testid="field-2"]'),
      objectId: "duplicate-id",
    });

    // Verify each field has the correct value
    field1.getSelectedText().should("eq", "Root Node");
    field2.getSelectedText().should("eq", "Child Node 1");

    // Test interactions with each field
    field1.selectById("node3");
    field2.selectById("node4");

    // Verify the values were updated correctly
    field1.getSelectedText().should("eq", "Child Node 2");
    field2.getSelectedText().should("eq", "Grandchild Node");
  });

  it("throws an error when multiple elements match but no index is provided", () => {
    // Create a test component with multiple fields of the same type and ID
    const TestFormWithDuplicateFields = () => (
      <div>
        <div data-testid="duplicate-container">
          <ObjectSchemaProvider
            schema={z.object({
              parentId1: z.string().optional(),
              parentId2: z.string().optional(),
            })}
            objectType="Node"
          >
            <AutoForm
              schema={
                new ZodBridge({
                  schema: z.object({
                    parentId1: z.string().optional(),
                    parentId2: z.string().optional(),
                  }),
                })
              }
              model={{ parentId1: "node1", parentId2: "node2" }}
              onSubmit={() => {}}
            >
              <div data-testid="field-1">
                <ParentField
                  name="parentId1"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="duplicate-id"
                  currentId="node3"
                />
              </div>
              <div data-testid="field-2">
                <ParentField
                  name="parentId2"
                  options={nodeOptions}
                  reference={nodeReferenceMetadata}
                  objectId="duplicate-id"
                  currentId="node4"
                />
              </div>
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
    const field = parentField({
      fieldName: "parentId1",
      objectType: "Node",
      objectId: "duplicate-id",
    });

    // Attempt to interact with the field, which should trigger the error
    field.getElement();
  });
});
