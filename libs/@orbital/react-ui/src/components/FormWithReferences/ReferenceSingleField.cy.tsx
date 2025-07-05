// @ts-nocheck
/// <reference types="cypress" />
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { mount } from "cypress/react";
import { referenceSingleField } from "../../../cypress/interactables/FormWithReferences/ReferenceSingleField.interactable";

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
  objectType, // Required prop
}) => {
  // If no reference options are provided, fall back to a standard text field
  if (!reference || !reference.options || reference.options.length === 0) {
    // Use the provided objectType

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
        data-testid={`${objectType}ReferenceSingleField ReferenceSingleField`}
      />
    );
  }

  // Get the foreign field to display and use as value
  const foreignField = reference.foreignField || "_id";
  const displayField = "name";

  // Use the provided objectType

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
      data-testid={`${objectType}ReferenceSingleField ReferenceSingleField`}
    >
      {!required && (
        <MenuItem
          value=""
          data-testid={`${objectType}ReferenceSingleField-none`}
          data-field-name={name}
        >
          <em>None</em>
        </MenuItem>
      )}
      {reference.options.map((option) => (
        <MenuItem
          key={option[foreignField]}
          value={option[foreignField]}
          data-testid={`${objectType}ReferenceSingleField-item`}
          data-object-id={option[foreignField]}
          data-field-name={name}
        >
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
        objectType="Area"
      />
    );

    // Use the interactable to interact with the component
    const field = referenceSingleField("worldId", "Area");

    // Check that the component renders
    field.getElement().should("exist");

    // Open the dropdown
    field.click();

    // Verify dropdown options
    field.getOptions().should("have.length", 4); // 3 options + "None"
    field.getOptions().eq(0).should("contain", "None");
    field.getOptions().eq(1).should("contain", "Earth");
    field.getOptions().eq(2).should("contain", "Mars");
    field.getOptions().eq(3).should("contain", "Jupiter");
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
        objectType="Area"
      />
    );

    // Use the interactable to interact with the component
    const field = referenceSingleField("worldId", "Area");

    // Check that the component renders as a text field
    field.getElement().should("exist");
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
        objectType="Area"
      />
    );

    // Use the interactable to select a value
    const field = referenceSingleField("worldId", "Area");
    field.selectById("world1"); // Select "Earth"

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
        objectType="Area"
      />
    );

    // Use the interactable to check the selected value
    const field = referenceSingleField("worldId", "Area");
    field.getSelectedText().should("eq", "Mars");
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
        objectType="Area"
      />
    );

    // Use the interactable to check if the field is required
    const field = referenceSingleField("worldId", "Area");
    field.isRequired().should("eq", true);

    // Check that the "None" option is not available
    field.getOptions().should("have.length", 3); // Only the 3 options, no "None"
    field.getOptions().eq(0).should("contain", "Earth");
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
        objectType="Area"
      />
    );

    // Use the interactable to check if the field is disabled
    const field = referenceSingleField("worldId", "Area");
    field.isDisabled().should("eq", true);
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
        objectType="Area"
      />
    );

    // Use the interactable to check if the field has an error
    const field = referenceSingleField("worldId", "Area");
    field.hasError().should("eq", true);
    field.getErrorMessage().should("eq", "This field is required");
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
        objectType="Area"
      />
    );

    // Use the interactable to check that the component falls back to a text field
    const field = referenceSingleField("worldId", "Area");
    field.getElement().should("exist");
    cy.get("input.MuiOutlinedInput-input").should("exist");
  });
});
