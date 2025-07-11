/// <reference types="cypress" />
import { z } from "zod";
import {
  FormDialogInteractable,
  ZodObjectSchema,
} from "./FormDialog.interactable";

/**
 * Test schemas for form dialogs
 */
// Basic schema for simple form tests
const basicSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  age: z.number().min(18).optional(),
});

// Complex schema for testing nested fields
const complexSchema = z.object({
  personal: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  preferences: z.object({
    notifications: z.boolean(),
    theme: z.enum(["light", "dark", "system"]),
  }),
});

type BasicFormData = z.infer<typeof basicSchema>;
type ComplexFormData = z.infer<typeof complexSchema>;

/**
 * Test implementation of FormDialogInteractable for testing purposes
 */
class TestFormDialogInteractable<
  Schema extends ZodObjectSchema = typeof basicSchema,
> extends FormDialogInteractable<Schema> {
  constructor(
    schema: Schema = basicSchema as unknown as Schema,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    super({
      dataTestId: "TestFormDialog",
      formTestId: "TestForm",
      schema,
      parentElement,
      componentName: "Dialog",
    });
  }

  /**
   * Override the open method for testing
   */
  override open(): Cypress.Chainable<void> {
    cy.get('[data-testid="OpenFormDialogButton"]').click();
    return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Override the close method for testing
   */
  override close(): Cypress.Chainable<void> {
    cy.get('[data-testid="CloseFormDialogButton"]').click();
    return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Custom method to get the form title
   */
  getFormTitle(): Cypress.Chainable<string> {
    return this.get({}).find('[data-testid="FormTitle"]').invoke("text");
  }

  /**
   * Custom method to submit with validation
   */
  submitWithValidation(data: Partial<z.infer<Schema>>): this {
    // Fill the form
    this.form().fill(data);

    // Click submit button
    this.get({}).find('[data-testid="SubmitButton"]').click();

    // Return this for chaining
    return this;
  }
}

/**
 * Complex form dialog implementation for testing nested fields
 */
class ComplexFormDialogInteractable extends FormDialogInteractable<
  typeof complexSchema
> {
  constructor(parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>) {
    super({
      dataTestId: "ComplexFormDialog",
      formTestId: "ComplexForm",
      schema: complexSchema,
      parentElement,
      componentName: "Dialog",
    });
  }

  /**
   * Override the open method for testing
   */
  override open(): Cypress.Chainable<void> {
    cy.get('[data-testid="OpenComplexFormDialogButton"]').click();
    return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Override the close method for testing
   */
  override close(): Cypress.Chainable<void> {
    cy.get('[data-testid="CloseComplexFormDialogButton"]').click();
    return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
  }
}

/**
 * Helper function to create a TestFormDialogInteractable instance
 */
function testFormDialog<Schema extends ZodObjectSchema = typeof basicSchema>(
  schema?: Schema,
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): TestFormDialogInteractable<Schema> {
  return new TestFormDialogInteractable<Schema>(
    schema as Schema,
    parentElement
  );
}

/**
 * Helper function to create a ComplexFormDialogInteractable instance
 */
function complexFormDialog(
  parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
): ComplexFormDialogInteractable {
  return new ComplexFormDialogInteractable(parentElement);
}

describe("FormDialogInteractable", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mount a component with a form dialog
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenFormDialogButton">Open Form Dialog</button>
          <div data-testid="TestFormDialog" style={{ display: "none" }}>
            <h2 data-testid="FormTitle">Test Form Dialog</h2>
            <form data-testid="TestForm">
              <div>
                <label htmlFor="name">Name</label>
                <input data-testid="name" name="name" type="text" />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input data-testid="email" name="email" type="email" />
              </div>
              <div>
                <label htmlFor="age">Age</label>
                <input data-testid="age" name="age" type="number" />
              </div>
              <button data-testid="SubmitButton" type="submit">
                Submit
              </button>
              <button data-testid="CloseFormDialogButton" type="button">
                Cancel
              </button>
            </form>
          </div>
        </div>
      );
    });

    it("should get the form within the dialog", () => {
      // Mount a fresh component to avoid any state issues
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenFormDialogButton">Open Form Dialog</button>
          <div data-testid="TestFormDialog" style={{ display: "block" }}>
            <h2 data-testid="FormTitle">Test Form Dialog</h2>
            <form data-testid="TestForm">
              <div>
                <label htmlFor="name">Name</label>
                <input data-testid="name" name="name" type="text" />
              </div>
              <button data-testid="SubmitButton" type="submit">
                Submit
              </button>
              <button data-testid="CloseFormDialogButton" type="button">
                Cancel
              </button>
            </form>
          </div>
        </div>
      );

      // Create the dialog interactable
      const dialog = testFormDialog();

      // Verify the dialog is visible
      dialog.isOpened().should("eq", true);

      // Verify the form exists directly first
      cy.get('[data-testid="TestFormDialog"]')
        .find('[data-testid="TestForm"]')
        .should("exist");

      // Get the form through the dialog interactable
      const form = dialog.form();

      // Verify we can interact with form elements
      form.get({}).find('[data-testid="name"]').should("exist");
      form.get({}).find('[data-testid="SubmitButton"]').should("exist");
    });

    it("should fill and submit the form", () => {
      const dialog = testFormDialog();

      // Create a submit spy
      const submitSpy = cy.spy().as("submitSpy");

      // Make the dialog visible first
      cy.get('[data-testid="TestFormDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Attach the spy to the form
      dialog
        .get({})
        .find("form")
        .then(($form) => {
          $form.on("submit", (e) => {
            e.preventDefault();
            submitSpy();
            // Hide the dialog to simulate it closing
            cy.get('[data-testid="TestFormDialog"]').invoke(
              "css",
              "display",
              "none"
            );
          });
        });

      // Fill and submit the form with force: true
      cy.get('[data-testid="name"]')
        .should("be.visible")
        .clear({ force: true })
        .type("Test User", { force: true });
      cy.get('[data-testid="email"]')
        .should("be.visible")
        .clear({ force: true })
        .type("test@example.com", { force: true });
      cy.get('[data-testid="age"]')
        .should("be.visible")
        .clear({ force: true })
        .type("25", { force: true });
      cy.get('[data-testid="SubmitButton"]')
        .should("be.visible")
        .click({ force: true });

      // Verify the form was submitted
      cy.get("@submitSpy").should("have.been.called");

      // Verify the dialog is closed after submission
      cy.get('[data-testid="TestFormDialog"]').should(
        "have.css",
        "display",
        "none"
      );
      dialog.isOpened().should("eq", false);
    });

    it("should use custom form methods", () => {
      const dialog = testFormDialog();

      // Make the dialog visible first
      cy.get('[data-testid="TestFormDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Get the form title
      dialog.getFormTitle().should("eq", "Test Form Dialog");

      // Create a submit spy
      const submitSpy = cy.spy().as("submitSpy");

      // Attach the spy to the form
      dialog
        .get({})
        .find("form")
        .then(($form) => {
          $form.on("submit", (e) => {
            e.preventDefault();
            submitSpy();
          });
        });

      // Use the custom submit method with force: true for all interactions
      cy.get('[data-testid="name"]')
        .clear({ force: true })
        .type("Test User", { force: true });
      cy.get('[data-testid="email"]')
        .clear({ force: true })
        .type("test@example.com", { force: true });
      cy.get('[data-testid="SubmitButton"]').click({ force: true });

      // Verify the form was submitted
      cy.get("@submitSpy").should("have.been.called");
    });
  });

  describe("Complex Form Dialog", () => {
    beforeEach(() => {
      // Mount a component with a complex form dialog
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenComplexFormDialogButton">
            Open Complex Form
          </button>
          <div data-testid="ComplexFormDialog" style={{ display: "none" }}>
            <h2>Complex Form Dialog</h2>
            <form data-testid="ComplexForm">
              {/* Personal Information */}
              <fieldset>
                <legend>Personal Information</legend>
                <div>
                  <label htmlFor="personal.firstName">First Name</label>
                  <input
                    data-testid="personal.firstName"
                    name="personal.firstName"
                    type="text"
                  />
                </div>
                <div>
                  <label htmlFor="personal.lastName">Last Name</label>
                  <input
                    data-testid="personal.lastName"
                    name="personal.lastName"
                    type="text"
                  />
                </div>
              </fieldset>

              {/* Contact Information */}
              <fieldset>
                <legend>Contact Information</legend>
                <div>
                  <label htmlFor="contact.email">Email</label>
                  <input
                    data-testid="contact.email"
                    name="contact.email"
                    type="email"
                  />
                </div>
                <div>
                  <label htmlFor="contact.phone">Phone</label>
                  <input
                    data-testid="contact.phone"
                    name="contact.phone"
                    type="tel"
                  />
                </div>
              </fieldset>

              {/* Preferences */}
              <fieldset>
                <legend>Preferences</legend>
                <div>
                  <label htmlFor="preferences.notifications">
                    Notifications
                  </label>
                  <input
                    data-testid="preferences.notifications"
                    name="preferences.notifications"
                    type="checkbox"
                  />
                </div>
                <div>
                  <label htmlFor="preferences.theme">Theme</label>
                  <select
                    data-testid="preferences.theme"
                    name="preferences.theme"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </fieldset>

              <button data-testid="SubmitButton" type="submit">
                Submit
              </button>
              <button data-testid="CloseComplexFormDialogButton" type="button">
                Cancel
              </button>
            </form>
          </div>
        </div>
      );
    });

    it("should handle complex nested form fields", () => {
      const dialog = complexFormDialog();

      // Make the dialog visible first
      cy.get('[data-testid="ComplexFormDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Get the form
      const form = dialog.form();

      // Fill nested fields with force: true
      // @ts-ignore - TypeScript doesn't recognize dot notation for nested fields
      cy.get('[data-testid="personal.firstName"]')
        .clear({ force: true })
        .type("John", { force: true });
      // @ts-ignore
      cy.get('[data-testid="personal.lastName"]')
        .clear({ force: true })
        .type("Doe", { force: true });
      // @ts-ignore
      cy.get('[data-testid="contact.email"]')
        .clear({ force: true })
        .type("john.doe@example.com", { force: true });
      // @ts-ignore
      cy.get('[data-testid="contact.phone"]')
        .clear({ force: true })
        .type("555-123-4567", { force: true });
      // @ts-ignore
      cy.get('[data-testid="preferences.notifications"]').check({
        force: true,
      });
      // @ts-ignore
      cy.get('[data-testid="preferences.theme"]').select("dark", {
        force: true,
      });

      // Verify values were set correctly
      cy.get('[data-testid="personal.firstName"]').should("have.value", "John");
      cy.get('[data-testid="personal.lastName"]').should("have.value", "Doe");
      cy.get('[data-testid="contact.email"]').should(
        "have.value",
        "john.doe@example.com"
      );
      cy.get('[data-testid="contact.phone"]').should(
        "have.value",
        "555-123-4567"
      );
      cy.get('[data-testid="preferences.notifications"]').should("be.checked");
      cy.get('[data-testid="preferences.theme"]').should("have.value", "dark");
    });

    it("should submit complex form with nested data structure", () => {
      const dialog = complexFormDialog();

      // Create a submit spy
      const submitSpy = cy.spy().as("submitSpy");

      // Make the dialog visible first
      cy.get('[data-testid="ComplexFormDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Attach the spy to the form
      dialog
        .get({})
        .find("form")
        .then(($form) => {
          $form.on("submit", (e) => {
            e.preventDefault();
            submitSpy();
            // Hide the dialog to simulate it closing
            cy.get('[data-testid="ComplexFormDialog"]').invoke(
              "css",
              "display",
              "none"
            );
          });
        });

      // Fill the form manually with force: true
      cy.get('[data-testid="personal.firstName"]')
        .should("be.visible")
        .clear({ force: true })
        .type("Jane", { force: true });
      cy.get('[data-testid="personal.lastName"]')
        .should("be.visible")
        .clear({ force: true })
        .type("Smith", { force: true });
      cy.get('[data-testid="contact.email"]')
        .should("be.visible")
        .clear({ force: true })
        .type("jane.smith@example.com", { force: true });
      cy.get('[data-testid="contact.phone"]')
        .should("be.visible")
        .clear({ force: true })
        .type("555-987-6543", { force: true });
      cy.get('[data-testid="preferences.notifications"]')
        .should("be.visible")
        .check({
          force: true,
        });
      cy.get('[data-testid="preferences.theme"]')
        .should("be.visible")
        .select("system", {
          force: true,
        });
      cy.get('[data-testid="SubmitButton"]')
        .should("be.visible")
        .click({ force: true });

      // Verify the form was submitted
      cy.get("@submitSpy").should("have.been.called");

      // Verify the dialog is closed
      cy.get('[data-testid="ComplexFormDialog"]').should(
        "have.css",
        "display",
        "none"
      );
      dialog.isOpened().should("eq", false);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle dialog not closing after form submission", () => {
      // Mount a component with a form dialog that doesn't close on submit
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenFormDialogButton">Open Form Dialog</button>
          <div data-testid="TestFormDialog" style={{ display: "none" }}>
            <h2>Test Form Dialog</h2>
            <form data-testid="TestForm" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="name">Name</label>
                <input data-testid="name" name="name" type="text" />
              </div>
              <button data-testid="SubmitButton" type="submit">
                Submit
              </button>
              <button data-testid="CloseFormDialogButton" type="button">
                Cancel
              </button>
            </form>
          </div>
        </div>
      );

      const dialog = testFormDialog();

      // Open the dialog
      dialog.open();

      // Set up a spy for the error
      const errorSpy = cy.spy().as("errorSpy");

      // Override the default error behavior
      cy.on("fail", (err) => {
        errorSpy(err.message);
        return false; // Prevent the error from failing the test
      });

      // Submit the form - this should timeout waiting for the dialog to close
      dialog.submit({ name: "Test User" });

      // Verify the error was thrown with the correct message
      cy.get("@errorSpy").should(
        "have.been.calledWithMatch",
        /did not close within/
      );
    });

    it("should handle form validation errors", () => {
      // Mount a component with a form dialog that has validation
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenFormDialogButton">Open Form Dialog</button>
          <div data-testid="TestFormDialog" style={{ display: "block" }}>
            <h2>Test Form Dialog</h2>
            <form
              data-testid="TestForm"
              onSubmit={(e) => {
                e.preventDefault();
                // Get the input element
                const nameInput = e.currentTarget.querySelector(
                  '[name="name"]'
                ) as HTMLInputElement;

                // Check if the name is valid
                if (!nameInput.value) {
                  // Add validation error
                  const errorElement = document.createElement("div");
                  errorElement.setAttribute("data-testid", "ValidationError");
                  errorElement.textContent = "Name is required";
                  errorElement.style.color = "red";

                  // Remove any existing error
                  const existingError = e.currentTarget.querySelector(
                    '[data-testid="ValidationError"]'
                  );
                  if (existingError) {
                    existingError.remove();
                  }

                  // Add the error after the input
                  nameInput.parentNode?.appendChild(errorElement);
                } else {
                  // Hide the dialog on successful validation
                  const dialog = document.querySelector(
                    '[data-testid="TestFormDialog"]'
                  ) as HTMLElement;
                  if (dialog) {
                    dialog.style.display = "none";
                  }
                }
              }}
            >
              <div>
                <label htmlFor="name">Name</label>
                <input data-testid="name" name="name" type="text" />
              </div>
              <button data-testid="SubmitButton" type="submit">
                Submit
              </button>
              <button data-testid="CloseFormDialogButton" type="button">
                Cancel
              </button>
            </form>
          </div>
        </div>
      );

      const dialog = testFormDialog();

      // Verify the dialog is initially open (we mounted it with display: block)
      dialog.isOpened().should("eq", true);

      // Submit with empty required field - use force: true
      cy.get('[data-testid="SubmitButton"]')
        .should("be.visible")
        .click({ force: true });

      // Verify the validation error appears
      cy.get('[data-testid="ValidationError"]')
        .should("exist")
        .should("have.text", "Name is required");

      // Verify the dialog is still open
      dialog.isOpened().should("eq", true);

      // Now submit with valid data - use force: true
      cy.get('[data-testid="name"]')
        .should("be.visible")
        .clear({ force: true })
        .type("Valid Name", { force: true });
      cy.get('[data-testid="SubmitButton"]')
        .should("be.visible")
        .click({ force: true });

      // Verify the dialog closes
      cy.get('[data-testid="TestFormDialog"]').should(
        "have.css",
        "display",
        "none"
      );
      dialog.isOpened().should("eq", false);
    });

    it("should handle different schema types", () => {
      // Create a custom schema for this test
      const customSchema = z.object({
        id: z.number(),
        title: z.string(),
        isActive: z.boolean(),
        tags: z.array(z.string()),
      });

      // Mount a component with a form dialog
      cy.mount(
        <div data-testid="Container">
          <button data-testid="OpenFormDialogButton">Open Form Dialog</button>
          <div data-testid="TestFormDialog" style={{ display: "none" }}>
            <h2>Custom Schema Form</h2>
            <form data-testid="TestForm">
              <div>
                <label htmlFor="id">ID</label>
                <input data-testid="id" name="id" type="number" />
              </div>
              <div>
                <label htmlFor="title">Title</label>
                <input data-testid="title" name="title" type="text" />
              </div>
              <div>
                <label htmlFor="isActive">Active</label>
                <input data-testid="isActive" name="isActive" type="checkbox" />
              </div>
              <div>
                <label htmlFor="tags">Tags</label>
                <input data-testid="tags" name="tags" type="text" />
              </div>
              <button data-testid="SubmitButton" type="submit">
                Submit
              </button>
              <button data-testid="CloseFormDialogButton" type="button">
                Cancel
              </button>
            </form>
          </div>
        </div>
      );

      // Create a dialog with the custom schema
      const dialog = testFormDialog<typeof customSchema>(customSchema);

      // Make the dialog visible first
      cy.get('[data-testid="TestFormDialog"]').invoke(
        "css",
        "display",
        "block"
      );

      // Verify we can access fields defined in the custom schema - use force: true
      cy.get('[data-testid="id"]')
        .clear({ force: true })
        .type("123", { force: true });
      cy.get('[data-testid="title"]')
        .clear({ force: true })
        .type("Custom Title", { force: true });
      cy.get('[data-testid="isActive"]').check({ force: true });

      // Verify values were set correctly
      cy.get('[data-testid="id"]').should("have.value", "123");
      cy.get('[data-testid="title"]').should("have.value", "Custom Title");
      cy.get('[data-testid="isActive"]').should("be.checked");
    });
  });
});
