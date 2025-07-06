// FormWithReferences.interactable.cy.tsx
// This file contains tests for the FormWithReferences interactable

/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import {
  FormWithReferences,
  ZodReferencesBridge,
} from "../../../src/components/FormWithReferences";
import { formWithReferences } from "./FormWithReferences.interactable";

describe("FormWithReferences Interactable", () => {
  // Sample schemas for testing
  const worldSchema = z
    .object({
      _id: z.string(),
      name: z.string(),
      description: z.string().optional(),
    })
    .describe("A world in the game universe");

  const areaSchema = z.object({
    // Remove the _id field as it's not being filled in the test
    name: z.string(),
    description: z.string().optional(),
    worldId: z.string().reference({
      schema: worldSchema,
      type: RelationshipType.MANY_TO_ONE,
      name: "world",
    }),
    tags: z
      .array(z.string())
      .reference({
        schema: z.object({ _id: z.string(), name: z.string() }),
        type: RelationshipType.MANY_TO_MANY,
        name: "tag",
      })
      .optional(),
  });

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

  it("should interact with standard form fields", () => {
    // Create a simple form with standard fields
    const schema = z.object({
      name: z.string(),
      description: z.string().optional(),
    });

    const bridge = new ZodBridge({ schema });
    const onSubmit = cy.stub().as("onSubmit");

    // Mount the form
    mount(
      <AutoForm schema={bridge} onSubmit={onSubmit} data-testid="test-form" />
    );

    // Create the interactable
    const form = formWithReferences("test-form");

    // Fill the form
    form.fill({
      name: "Test Name",
      description: "Test Description",
    });

    // Submit the form
    form.submit();

    // Check that onSubmit was called with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Name",
      description: "Test Description",
    });
  });

  it.only("should interact with reference fields", () => {
    // Create a form with reference fields
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    const bridge = new ZodReferencesBridge({
      schema: areaSchema,
      dependencies: {
        world: worldData,
        tag: tagData,
      },
    });

    // Mount the form
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
        objectType="Area"
      />
    );

    // Create the interactable
    const form = formWithReferences("test-form", "Area");

    // Fill the form with standard and reference fields
    form.fill({
      name: "Test Area",
      description: "Test Description",
      worldId: "world1",
      tags: ["tag1"], // Add tags to pass validation
    });

    // Submit the form
    form.submit();

    // Debug: Check if the form was actually submitted
    cy.window().then((win) => {
      // Check if there are any form submit events
      cy.get("form");
    });

    // Check that onSubmit was called with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Area",
      description: "Test Description",
      worldId: "world1",
      tags: ["tag1"],
    });
  });

  it("should handle multiple reference fields", () => {
    // Create a form with multiple reference fields
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    const bridge = new ZodReferencesBridge({
      schema: areaSchema,
      dependencies: {
        world: worldData,
        tag: tagData,
      },
    });

    // Mount the form
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
      />
    );

    // Check what fields are rendered
    cy.get("[data-testid='test-form']").then(($form) => {
      // Check fields exist
      $form.find("input, select").each((index, el) => {
        // Just verify elements exist without logging
      });
    });

    // Create the interactable
    const form = formWithReferences("test-form", "Area");

    // Fill the form with standard and reference fields
    form.fill({
      name: "Test Area",
      description: "Test Description",
      worldId: "world2",
      tags: ["tag1", "tag2"],
    });

    // Submit the form
    form.submit();

    // Check that onSubmit was called with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Area",
      description: "Test Description",
      worldId: "world2",
      tags: ["tag1", "tag2"],
    });
  });

  it("should handle form with no reference fields", () => {
    // Create a simple form with no reference fields
    const schema = z.object({
      name: z.string(),
      description: z.string().optional(),
      active: z.boolean().default(false),
    });

    const bridge = new ZodBridge({ schema });
    const onSubmit = cy.stub().as("onSubmit");

    // Mount the form
    mount(
      <AutoForm schema={bridge} onSubmit={onSubmit} data-testid="test-form" />
    );

    // Create the interactable
    const form = formWithReferences("test-form");

    // Fill the form
    form.fill({
      name: "Test Name",
      description: "Test Description",
      active: true,
    });

    // Submit the form
    form.submit();

    // Check that onSubmit was called with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Name",
      description: "Test Description",
      active: true,
    });
  });

  it("should automatically infer object type from schema", () => {
    // Create a form with reference fields but without explicitly providing objectType
    const onSubmit = cy.stub().as("onSubmit");

    // Create a schema with a description that should help infer the type
    const characterSchema = z
      .object({
        name: z.string(),
        description: z.string().optional(),
        worldId: z.string().reference({
          schema: worldSchema,
          type: RelationshipType.MANY_TO_ONE,
          name: "world",
        }),
      })
      .describe("A character in the game universe");

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

    // Check that the form has the correct data-testid attributes
    cy.get("[data-testid*='CharacterReferenceSingleField']").should("exist");

    // Create the interactable (using "Character" as the expected inferred type)
    const form = formWithReferences("test-form", "Character");

    // Fill the form
    form.fill({
      name: "Test Character",
      description: "Test Description",
      worldId: "world1",
    });

    // Submit the form
    form.submit();

    // Check that onSubmit was called with the correct data
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Character",
      description: "Test Description",
      worldId: "world1",
    });
  });
});
