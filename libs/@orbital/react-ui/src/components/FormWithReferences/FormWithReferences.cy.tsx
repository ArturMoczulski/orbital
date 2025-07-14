import { RelationshipType, z } from "@orbital/core";
import { mount } from "cypress/react";
import React from "react";
import { AutoField } from "uniforms-mui";
import { formWithReferences } from "../../../cypress/interactables/ObjectForm/FormWithReferences.interactable";
import { FormWithReferences, ZodReferencesBridge } from "./index";

describe("FormWithReferences Component", () => {
  // Sample schemas for testing
  const worldSchema = z
    .object({
      _id: z.string(),
      name: z.string(),
      description: z.string().optional(),
    })
    .describe("A world in the game universe");

  const characterSchema = z
    .object({
      name: z.string(),
      description: z.string().optional(),
      worldId: z.string().reference({
        schema: worldSchema,
        type: RelationshipType.BELONGS_TO,
        name: "world",
      }),
    })
    .describe("A character in the game universe");

  const itemSchema = z
    .object({
      name: z.string(),
      description: z.string().optional(),
      tags: z
        .array(z.string())
        .reference({
          schema: z.object({ _id: z.string(), name: z.string() }),
          type: RelationshipType.HAS_MANY,
          name: "tag",
        })
        .optional(),
    })
    .describe("An item with various properties");

  // Sample data for testing
  const worldData = [
    { _id: "world1", name: "Earth" },
    { _id: "world2", name: "Mars" },
  ];

  const tagData = [
    { _id: "tag1", name: "Fantasy" },
    { _id: "tag2", name: "Sci-Fi" },
  ];

  beforeEach(() => {
    // Disable uncaught exception handling
    cy.on("uncaught:exception", () => false);
  });

  it("should infer object type from schema description", () => {
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    const bridge = new ZodReferencesBridge({
      schema: characterSchema,
      dependencies: {
        world: worldData,
      },
    });

    // Mount the form WITHOUT providing objectType
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
      />
    );

    // Create the interactable using the inferred object type
    const form = formWithReferences("test-form", "Character");

    // Check that the form has correctly inferred the object type
    // by verifying the data-testid attributes on the reference fields
    cy.get("[data-testid*='CharacterReferenceSingleField']").should("exist");

    // Verify the field label is correctly derived from the reference name
    cy.get("[data-testid*='CharacterReferenceSingleField']")
      .find("label")
      .should("contain.text", "World");

    // Fill and submit the form using the interactable
    form.fill({
      name: "Test Character",
      worldId: "world1",
    });

    form.submit();

    // Verify the form was submitted with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Character",
      description: "",
      worldId: "world1",
    });
  });

  it("should use provided objectType when specified", () => {
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    const bridge = new ZodReferencesBridge({
      schema: characterSchema,
      dependencies: {
        world: worldData,
      },
    });

    // Mount the form WITH explicitly providing objectType
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
        objectType="CustomType"
      />
    );

    // Create the interactable using the provided object type
    const form = formWithReferences("test-form", "CustomType");

    // Check that the form uses the provided object type
    cy.get("[data-testid*='CustomTypeReferenceSingleField']").should("exist");

    // Fill and submit the form using the interactable
    form.fill({
      name: "Test Custom",
      worldId: "world1",
    });

    form.submit();
  });

  it("should create context with custom field types", () => {
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema with both single and array references
    const bridge = new ZodReferencesBridge({
      schema: z.object({
        name: z.string(),
        worldId: z.string().reference({
          schema: worldSchema,
          type: RelationshipType.BELONGS_TO,
          name: "world",
        }),
        tags: z.array(z.string()).reference({
          schema: z.object({ _id: z.string(), name: z.string() }),
          type: RelationshipType.HAS_MANY,
          name: "tag",
        }),
      }),
      dependencies: {
        world: worldData,
        tag: tagData,
      },
    });

    // Spy on the context creation
    cy.window().then((win) => {
      cy.spy(React, "useMemo").as("contextCreation");
    });

    // Mount the form
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
        objectType="TestObject"
      />
    );

    // Verify context was created with our field types
    cy.get("@contextCreation").should("have.been.called");

    // Create the interactable
    const form = formWithReferences("test-form", "TestObject");

    // Verify both single and array reference fields are rendered
    cy.get("[data-testid*='TestObjectReferenceSingleField']").should("exist");
    cy.get("[data-testid*='TestObjectReferenceArrayField']").should("exist");

    // Fill and submit the form using the interactable
    form.fill({
      name: "Test Object",
      worldId: "world1",
      tags: ["tag1", "tag2"],
    });

    form.submit();
  });

  it("should use custom component detector for reference fields", () => {
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    const bridge = new ZodReferencesBridge({
      schema: itemSchema,
      dependencies: {
        tag: tagData,
      },
    });

    // Spy on the AutoField.componentDetectorContext.Provider
    cy.window().then((win) => {
      cy.spy(AutoField.componentDetectorContext, "Provider").as(
        "detectorProvider"
      );
    });

    // Mount the form
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
      />
    );

    // Verify the component detector context provider was used
    cy.get("@detectorProvider").should("have.been.called");

    // Create the interactable
    const form = formWithReferences("test-form", "Item");

    // Verify the reference array field is rendered correctly
    cy.get("[data-testid*='ItemReferenceArrayField']").should("exist");

    // Fill and submit the form using the interactable
    form.fill({
      name: "Test Item",
      description: "A test item",
      tags: ["tag1"],
    });

    // Verify the chip is displayed for the selected tag
    cy.get("[data-testid*='ItemReferenceArrayField']")
      .find(".MuiChip-label")
      .should("contain.text", "Fantasy");

    form.submit();
  });

  it("should handle forms with no reference fields", () => {
    const onSubmit = cy.stub().as("onSubmit");

    // Create a schema with no references
    const simpleSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
    });

    // Create a ZodReferencesBridge for the schema
    const bridge = new ZodReferencesBridge({
      schema: simpleSchema,
      dependencies: {},
    });

    // Mount the form
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
        objectType="Simple"
      />
    );

    // Create the interactable
    const form = formWithReferences("test-form", "Simple");

    // Verify standard fields are rendered correctly
    cy.get("input[name='name']").should("exist");
    cy.get("input[name='description']").should("exist");

    // Fill and submit the form using the interactable
    form.fill({
      name: "Test Simple",
      description: "A simple description",
    });

    form.submit();

    // Verify the form was submitted with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Simple",
      description: "A simple description",
    });
  });
});
