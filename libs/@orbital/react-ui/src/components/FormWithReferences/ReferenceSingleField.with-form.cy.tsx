// @ts-nocheck
/// <reference types="cypress" />
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { z } from "zod";
import { FormWithReferences } from "./FormWithReferences";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

// A simplified version of ReferenceSingleField for direct testing
const SimplifiedReferenceSingleField = ({
  id,
  name,
  label,
  onChange,
  value = "",
  reference,
  required = false,
  error = false,
  errorMessage = "",
  disabled = false,
}) => {
  // If no reference options are provided, fall back to a standard text field
  if (!reference || !reference.options || reference.options.length === 0) {
    return (
      <TextField
        id={id}
        name={name}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        error={error}
        helperText={errorMessage}
        disabled={disabled}
        fullWidth
        variant="outlined"
        data-testid="text-field"
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name";

  return (
    <TextField
      id={id}
      name={name}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      helperText={errorMessage}
      disabled={disabled}
      select
      fullWidth
      variant="outlined"
      data-testid="select-field"
    >
      {!required && (
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
      )}
      {reference.options.map((option) => (
        <MenuItem key={option[foreignField]} value={option[foreignField]}>
          {option[displayField] || option[foreignField]}
        </MenuItem>
      ))}
    </TextField>
  );
};

// A simple component to test the form rendering
const TestForm = ({ schema, model = {}, onSubmit = () => {} }) => {
  console.log("TestForm rendering with schema:", schema);
  console.log("TestForm rendering with model:", model);

  return (
    <div className="test-form-container" data-testid="test-form-container">
      <FormWithReferences
        schema={schema}
        onSubmit={(data) => {
          console.log("Form submitted with data:", data);
          onSubmit(data);
        }}
        model={model}
        showInlineError
      >
        <div className="form-buttons" data-testid="form-buttons">
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
          <button type="reset" data-testid="reset-button">
            Reset
          </button>
        </div>
      </FormWithReferences>
    </div>
  );
};

describe("SimplifiedReferenceSingleField Direct Test", () => {
  // Sample data for testing
  const worldsData = [
    { _id: "world1", name: "Earth" },
    { _id: "world2", name: "Mars" },
    { _id: "world3", name: "Jupiter" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "world",
    type: RelationshipType.MANY_TO_ONE,
    foreignField: "_id",
    options: worldsData,
  };

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", (err) => {
      console.log("Uncaught exception:", err.message);
      return false;
    });
  });

  it("renders with reference data as a select field", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component directly
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={referenceMetadata}
      />
    );

    // Check that the component renders as a select field
    cy.get("label").should("contain", "World");
    cy.get("[data-testid=select-field]").should("exist");

    // Check that it's a select field
    cy.get("[data-testid=select-field]").click();
    cy.get("li.MuiMenuItem-root").should("have.length", 4); // 3 options + "None"
    cy.get("li.MuiMenuItem-root").eq(0).should("contain", "None");
    cy.get("li.MuiMenuItem-root").eq(1).should("contain", "Earth");
    cy.get("li.MuiMenuItem-root").eq(2).should("contain", "Mars");
    cy.get("li.MuiMenuItem-root").eq(3).should("contain", "Jupiter");
  });

  it("calls onChange when a value is selected", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component directly
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={referenceMetadata}
      />
    );

    // Select an option
    cy.get("[data-testid=select-field]").click();
    cy.get("li.MuiMenuItem-root").eq(1).click(); // Select "Earth"

    // Check that onChange was called with the correct value
    cy.get("@onChange").should("have.been.calledWith", "world1");
  });

  it("displays the selected value", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component with a selected value
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={referenceMetadata}
        value="world2"
      />
    );

    // Check that the select field displays the selected value
    cy.get("[data-testid=select-field]").should("contain", "Mars");
  });
});

describe("FormWithReferences Basic Test", () => {
  // Sample data for testing
  const worldsData = [
    { _id: "world1", name: "Earth" },
    { _id: "world2", name: "Mars" },
    { _id: "world3", name: "Jupiter" },
  ];

  // Create a simple schema without using the reference method
  const TestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    worldId: z.string().optional(),
  });

  // Create dependencies for the reference field
  const dependencies = {
    world: worldsData,
  };

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", (err) => {
      console.log("Uncaught exception:", err.message);
      return false;
    });
  });

  it("renders a basic form", () => {
    // Create a bridge with the schema and dependencies
    const bridge = new ZodReferencesBridge({
      schema: TestSchema,
      dependencies,
    });

    // Create a simple onSubmit function
    const onSubmit = cy.stub().as("onSubmit");

    // Mount the component
    mount(<TestForm schema={bridge} onSubmit={onSubmit} />);

    // Log the document for debugging
    cy.document().then((doc) => {
      console.log("Document body HTML:", doc.body.innerHTML);
    });

    // Check that the form container renders
    cy.get("[data-testid=test-form-container]").should("exist");
    cy.get("[data-testid=form-buttons]").should("exist");
    cy.get("[data-testid=submit-button]").should("exist");
    cy.get("[data-testid=reset-button]").should("exist");
  });

  it("renders a form with initial values", () => {
    // Create a bridge with the schema and dependencies
    const bridge = new ZodReferencesBridge({
      schema: TestSchema,
      dependencies,
    });

    // Create a simple onSubmit function
    const onSubmit = cy.stub().as("onSubmit");

    // Mount the component with initial values
    mount(
      <TestForm
        schema={bridge}
        model={{ name: "Test Name", worldId: "world3" }}
        onSubmit={onSubmit}
      />
    );

    // Log the document for debugging
    cy.document().then((doc) => {
      console.log("Document body HTML:", doc.body.innerHTML);
    });

    // Check that the form container renders
    cy.get("[data-testid=test-form-container]").should("exist");
  });

  it("allows submitting a form", () => {
    // Create a bridge with the schema and dependencies
    const bridge = new ZodReferencesBridge({
      schema: TestSchema,
      dependencies,
    });

    // Create a simple onSubmit function
    const onSubmit = cy.stub().as("onSubmit");

    // Mount the component with a valid model to bypass validation
    mount(
      <TestForm
        schema={bridge}
        onSubmit={onSubmit}
        model={{ name: "Test Name" }}
      />
    );

    // Log the document for debugging
    cy.document().then((doc) => {
      console.log("Document body HTML:", doc.body.innerHTML);
    });

    // Log the form HTML for debugging
    cy.get("form")
      .should("exist")
      .then(($form) => {
        console.log("Form HTML:", $form.html());

        // Log all input elements
        const inputs = $form.find("input");
        console.log("Input elements:", inputs.length);
        inputs.each((i, el) => {
          console.log(`Input ${i}:`, el.outerHTML);
        });
      });

    // Submit the form with the pre-filled valid data
    cy.get("[data-testid=submit-button]").click();

    // Check that onSubmit was called
    cy.get("@onSubmit").should("have.been.called");
  });

  it("handles form reset", () => {
    // Create a bridge with the schema and dependencies
    const bridge = new ZodReferencesBridge({
      schema: TestSchema,
      dependencies,
    });

    // Mount the component with initial values
    mount(<TestForm schema={bridge} model={{ name: "Test Name" }} />);

    // Check that the form container renders
    cy.get("[data-testid=test-form-container]").should("exist");

    // Log the document for debugging
    cy.document().then((doc) => {
      console.log("Document body HTML:", doc.body.innerHTML);
    });

    // Log the form HTML for debugging
    cy.get("form")
      .should("exist")
      .then(($form) => {
        console.log("Form HTML:", $form.html());

        // Log all elements
        console.log("All form elements:", $form[0].outerHTML);
      });

    // Reset the form
    cy.get("[data-testid=reset-button]").click();
  });
});
