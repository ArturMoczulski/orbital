// @ts-nocheck
/// <reference types="cypress" />
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { autoForm } from "./AutoForm.cy.commands";

describe("AutoForm Interactable", () => {
  describe("Scoped Usage", () => {
    beforeEach(() => {
      // Create a simple schema for the form
      const schema = z.object({
        name: z.string().min(1, "Name is required"),
        age: z.number().min(0, "Age must be positive"),
        email: z.string().email("Invalid email format"),
      });

      // Create the form schema bridge
      const formSchema = new ZodBridge({ schema });

      // Stub for submit function
      const submitStub = cy.stub().as("submitStub");

      // Mount the component with a parent container and the form inside
      // Add a unique class to the form for easier selection
      cy.mount(
        <div className="parentContainer">
          <AutoForm
            className="test-form-class"
            data-testid="TestForm"
            schema={formSchema}
            onSubmit={submitStub}
          />
        </div>
      );
    });

    it("should access form inputs using scoped interactable", () => {
      // Debug: Log the DOM structure to see what's available
      cy.get(".parentContainer").then(($el) => {
        cy.log("Parent container HTML:", $el.html());
      });

      // Get the parent element
      const parent = cy.get(".parentContainer");

      // Create a scoped AutoForm interactable using class selector
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>({
        formTestId: "TestForm",
        parent: parent,
      });

      // Access individual inputs
      form.inputs.name.type("John Scoped");
      form.inputs.age.type(30);
      form.inputs.email.type("john.scoped@example.com");

      // Verify the values using the fluent API
      form.inputs.name.should("have.value", "John Scoped");
      form.inputs.age.should("have.value", "30");
      form.inputs.email.should("have.value", "john.scoped@example.com");
    });

    it("should fill and submit the form using scoped interactable", () => {
      // Get the parent element
      const parent = cy.get(".parentContainer");

      // Create a scoped AutoForm interactable using class selector
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>({
        formTestId: "TestForm",
        parent: parent,
      });

      // Fill and submit the form in one step
      form.submit({
        name: "Scoped Submit",
        age: 45,
        email: "scoped.submit@example.com",
      });

      // Verify the submit stub was called with the correct data
      cy.get("@submitStub").should("have.been.called");
      cy.get("@submitStub").then((stub) => {
        const callArg = stub.firstCall.args[0];
        expect(callArg).to.have.property("name", "Scoped Submit");
        expect(callArg).to.have.property("age", 45);
        expect(callArg).to.have.property("email", "scoped.submit@example.com");
      });
    });
  });

  describe("Basic Usage (Non-Scoped)", () => {
    beforeEach(() => {
      // Create a simple schema for the form
      const schema = z.object({
        name: z.string().min(1, "Name is required"),
        age: z.number().min(0, "Age must be positive"),
        email: z.string().email("Invalid email format"),
      });

      // Create the form schema bridge
      const formSchema = new ZodBridge({ schema });

      // Stub for submit function
      const submitStub = cy.stub().as("submitStub");

      // Mount the AutoForm component directly
      cy.mount(
        <AutoForm
          data-testid="TestForm"
          schema={formSchema}
          onSubmit={submitStub}
        />
      );
    });

    it("should access form inputs individually", () => {
      // Create an AutoForm interactable
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>("TestForm");

      // Access individual inputs
      form.inputs.name.type("John Doe");
      form.inputs.age.type(30);
      form.inputs.email.type("john.doe@example.com");

      // Verify the values using the fluent API
      form.inputs.name.should("have.value", "John Doe");
      form.inputs.age.should("have.value", "30");
      form.inputs.email.should("have.value", "john.doe@example.com");
    });

    it("should fill the form with data", () => {
      // Create an AutoForm interactable
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>("TestForm");

      // Fill the form with data
      form.fill({
        name: "Jane Smith",
        age: 25,
        email: "jane.smith@example.com",
      });

      // Verify the values using the fluent API
      form.inputs.name.should("have.value", "Jane Smith");
      form.inputs.age.should("have.value", "25");
      form.inputs.email.should("have.value", "jane.smith@example.com");
    });

    it("should submit the form", () => {
      // Create an AutoForm interactable
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>("TestForm");

      // Fill the form with data
      form.fill({
        name: "Submit Test",
        age: 35,
        email: "submit.test@example.com",
      });

      // Submit the form
      form.submit();

      // Verify the submit stub was called with the correct data
      cy.get("@submitStub").should("have.been.called");
      cy.get("@submitStub").then((stub) => {
        const callArg = stub.firstCall.args[0];
        expect(callArg).to.have.property("name", "Submit Test");
        expect(callArg).to.have.property("age", 35);
        expect(callArg).to.have.property("email", "submit.test@example.com");
      });
    });

    it("should fill and submit the form in one step", () => {
      // Create an AutoForm interactable
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>("TestForm");

      // Fill and submit the form in one step
      form.submit({
        name: "One Step",
        age: 40,
        email: "one.step@example.com",
      });

      // Verify the submit stub was called with the correct data
      cy.get("@submitStub").should("have.been.called");
      cy.get("@submitStub").then((stub) => {
        const callArg = stub.firstCall.args[0];
        expect(callArg).to.have.property("name", "One Step");
        expect(callArg).to.have.property("age", 40);
        expect(callArg).to.have.property("email", "one.step@example.com");
      });
    });

    it("should access form buttons", () => {
      // Create an AutoForm interactable
      const form = autoForm<{
        name: string;
        age: number;
        email: string;
      }>("TestForm");

      // Access the submit button
      form.buttons.submit().should("exist");
    });
  });
});
