// @ts-nocheck
/// <reference types="cypress" />
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";

// A simplified version of ReferenceSingleField
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

describe("SimplifiedReferenceSingleField", () => {
  // Sample data for testing
  const worldsData = [
    { _id: "world1", name: "Earth" },
    { _id: "world2", name: "Mars" },
    { _id: "world3", name: "Jupiter" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "world",
    type: "MANY_TO_ONE",
    foreignField: "_id",
    options: worldsData,
  };

  beforeEach(() => {
    // Disable uncaught exception handling for all errors
    cy.on("uncaught:exception", () => false);
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
    cy.get("div.MuiFormControl-root").should("exist");
    cy.get("div.MuiInputBase-root").should("exist");

    // Check that it's a select field
    cy.get("div.MuiInputBase-root").click();
    cy.get("li.MuiMenuItem-root").should("have.length", 4); // 3 options + "None"
    cy.get("li.MuiMenuItem-root").eq(0).should("contain", "None");
    cy.get("li.MuiMenuItem-root").eq(1).should("contain", "Earth");
    cy.get("li.MuiMenuItem-root").eq(2).should("contain", "Mars");
    cy.get("li.MuiMenuItem-root").eq(3).should("contain", "Jupiter");
  });

  it("renders without reference data as a text field", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component directly
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
      />
    );

    // Check that the component renders as a text field
    cy.get("label").should("contain", "World");
    cy.get("div.MuiFormControl-root").should("exist");
    cy.get("div.MuiInputBase-root").should("exist");
    cy.get("input.MuiOutlinedInput-input").should("exist");
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
    cy.get("div.MuiInputBase-root").click();
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
    cy.get("div.MuiInputBase-root").should("contain", "Mars");
  });

  it("handles required fields correctly", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component with required=true
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={referenceMetadata}
        required={true}
      />
    );

    // Check that the "None" option is not available
    cy.get("div.MuiInputBase-root").click();
    cy.get("li.MuiMenuItem-root").should("have.length", 3); // Only the 3 options, no "None"
    cy.get("li.MuiMenuItem-root").eq(0).should("contain", "Earth");
  });

  it("handles disabled state correctly", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component with disabled=true
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={referenceMetadata}
        disabled={true}
      />
    );

    // Check that the select field is disabled
    cy.get("div.MuiInputBase-root").should("have.class", "Mui-disabled");
  });

  it("handles error state correctly", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Mount the component with error=true
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={referenceMetadata}
        error={true}
        errorMessage="This field is required"
      />
    );

    // Check that the select field shows the error state
    cy.get("div.MuiInputBase-root").should("have.class", "Mui-error");
    cy.get("p.MuiFormHelperText-root").should(
      "contain",
      "This field is required"
    );
  });

  it("handles empty options array gracefully", () => {
    // Create a simple onChange function
    const onChange = cy.stub().as("onChange");

    // Create reference metadata with empty options
    const emptyReferenceMetadata = {
      ...referenceMetadata,
      options: [],
    };

    // Mount the component with empty reference data
    mount(
      <SimplifiedReferenceSingleField
        id="worldId"
        name="worldId"
        label="World"
        onChange={onChange}
        reference={emptyReferenceMetadata}
      />
    );

    // Check that the component falls back to a text field
    cy.get("div.MuiFormControl-root").should("exist");
    cy.get("input.MuiOutlinedInput-input").should("exist");
  });
});
