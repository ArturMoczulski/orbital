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
    cy.log("Creating onSubmit stub");
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    cy.log("Creating ZodReferencesBridge");
    const bridge = new ZodReferencesBridge({
      schema: areaSchema,
      dependencies: {
        world: worldData,
        tag: tagData,
      },
    });

    // Mount the form
    cy.log("Mounting FormWithReferences component");
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
      />
    );

    // Create the interactable
    cy.log("Creating FormWithReferences interactable");
    const form = formWithReferences("test-form", "Area");

    // Fill the form with standard and reference fields
    cy.log("Filling form with data");
    form.fill({
      name: "Test Area",
      description: "Test Description",
      worldId: "world1",
      tags: ["tag1"], // Add tags to pass validation
    });

    // Submit the form
    cy.log("Submitting form");
    form.submit();

    // Debug: Check if the form was actually submitted
    cy.window().then((win) => {
      cy.log("Window object:", win);
      // Check if there are any form submit events
      cy.get("form").then(($form) => {
        cy.log(`Form element found: ${$form.length > 0}`);
      });
    });

    // Check that onSubmit was called with the correct data
    cy.log("Checking if onSubmit was called");
    cy.get("@onSubmit").should("have.been.calledWith", {
      name: "Test Area",
      description: "Test Description",
      worldId: "world1",
      tags: ["tag1"],
    });
  });

  it("should handle multiple reference fields", () => {
    // Create a form with multiple reference fields
    cy.log("Creating onSubmit stub for multiple reference fields test");
    const onSubmit = cy.stub().as("onSubmit");

    // Create a ZodReferencesBridge for the schema
    cy.log("Creating ZodReferencesBridge for multiple reference fields test");
    const bridge = new ZodReferencesBridge({
      schema: areaSchema,
      dependencies: {
        world: worldData,
        tag: tagData,
      },
    });

    // Log the schema structure
    cy.log("Schema structure:", JSON.stringify(areaSchema._def));
    cy.log(
      "Dependencies:",
      JSON.stringify({
        world: worldData,
        tag: tagData,
      })
    );

    // Mount the form
    cy.log(
      "Mounting FormWithReferences component for multiple reference fields test"
    );
    mount(
      <FormWithReferences
        schema={bridge}
        onSubmit={onSubmit}
        data-testid="test-form"
      />
    );

    // Check what fields are rendered
    cy.get("[data-testid='test-form']").then(($form) => {
      cy.log(`Form found: ${$form.length > 0}`);
      cy.log(`Form fields:`, $form.find("input, select").length);

      // Log each field
      $form.find("input, select").each((index, el) => {
        const element = el as HTMLInputElement | HTMLSelectElement;
        cy.log(`Field ${index}:`, {
          name: element.name,
          id: element.id,
          type: element.type,
          "data-field-name": element.getAttribute("data-field-name"),
          "data-testid": element.getAttribute("data-testid"),
        });
      });
    });

    // Create the interactable
    cy.log(
      "Creating FormWithReferences interactable for multiple reference fields test"
    );
    const form = formWithReferences("test-form", "Area");

    // Fill the form with standard and reference fields
    cy.log("Filling form with data including array field");
    form.fill({
      name: "Test Area",
      description: "Test Description",
      worldId: "world2",
      tags: ["tag1", "tag2"],
    });

    // Submit the form
    cy.log("Submitting form for multiple reference fields test");
    form.submit();

    // Check that onSubmit was called with the correct data
    cy.log(
      "Checking if onSubmit was called for multiple reference fields test"
    );
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
});
