// HasManyField.interactable.cy.tsx
// Tests for the HasManyField interactable

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { mount } from "cypress/react";
import { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import HasManyField from "../../../src/components/FormWithReferences/HasManyField";
import { hasManyField } from "./HasManyField.interactable";

describe("HasManyField.interactable", () => {
  // Sample data for testing
  const tagOptions = [
    { _id: "tag1", name: "Action" },
    { _id: "tag2", name: "Comedy" },
    { _id: "tag3", name: "Drama" },
    { _id: "tag4", name: "Sci-Fi" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "tag",
    type: RelationshipType.HAS_MANY,
    foreignField: "_id",
    options: tagOptions,
  };

  // Create a simple schema for the field
  const schema = z.object({
    tagIds: z.array(z.string()).optional(),
  });

  const TestForm = ({
    disabled = false,
    required = false,
    initialValue = [],
    onChange = undefined,
  }: {
    disabled?: boolean;
    required?: boolean;
    initialValue?: string[];
    onChange?: (value: string[]) => void;
  }) => {
    const [value, setValue] = useState(initialValue);

    // Create a modified schema based on the required prop
    const formSchema = required
      ? schema
      : z.object({
          tagIds: z.array(z.string()).optional(),
        });

    const handleChange = (newValue: string[]) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <AutoForm
        schema={new ZodBridge({ schema: formSchema })}
        model={{ tagIds: value }}
        onSubmit={() => {}}
      >
        <HasManyField
          name="tagIds"
          objectType="Movie"
          disabled={disabled}
          required={required}
          options={tagOptions}
          onChange={handleChange}
          reference={referenceMetadata}
        />
      </AutoForm>
    );
  };

  it("should select multiple values", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm onChange={onChangeSpy} />);

    const field = hasManyField("tagIds", "Movie");

    field.selectById(["tag1", "tag3"]);

    cy.get("@onChange").should("have.been.calledWith", ["tag1", "tag3"]);
    field.getSelectedValues().should("deep.equal", ["tag1", "tag3"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Action");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Drama");
  });

  it("should handle disabled state", () => {
    mount(<TestForm disabled={true} initialValue={["tag1", "tag2"]} />);

    const field = hasManyField("tagIds", "Movie");

    field.isDisabled().should("be.true");
    field.getSelectedValues().should("deep.equal", ["tag1", "tag2"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Action");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Comedy");

    // Verify that clicking doesn't open the dropdown when disabled
    field.getElement().click();
    cy.get('[role="presentation"]').should("not.exist");
  });

  it("should handle required state", () => {
    mount(<TestForm required={true} />);

    const field = hasManyField("tagIds", "Movie");

    field.isRequired().should("be.true");
  });

  it("should clear selections", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm initialValue={["tag1", "tag2"]} onChange={onChangeSpy} />);

    const field = hasManyField("tagIds", "Movie");

    field.getSelectedValues().should("deep.equal", ["tag1", "tag2"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Action");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Comedy");

    // Use selectById with empty array to clear selections
    field.selectById([]);

    cy.get("@onChange").should("have.been.calledWith", []);
    field.getSelectedValues().should("deep.equal", []);
  });

  it("should handle empty reference options gracefully", () => {
    // Create a test component with no options
    const TestFormNoOptions = () => (
      <AutoForm
        schema={new ZodBridge({ schema })}
        model={{ tagIds: [] }}
        onSubmit={() => {}}
      >
        <HasManyField
          name="tagIds"
          objectType="Movie"
          reference={{
            ...referenceMetadata,
            options: [],
          }}
        />
      </AutoForm>
    );

    mount(<TestFormNoOptions />);

    const field = hasManyField("tagIds", "Movie");

    // Field should be disabled when no options are available
    field.isDisabled().should("be.true");

    // Check for the error message directly instead of using hasError
    field
      .getElement()
      .closest(".MuiFormControl-root")
      .find(".MuiFormHelperText-root")
      .should("contain.text", "No options available");
  });

  it("should scope to parent element", () => {
    // Create a test component with two identical fields
    const TestFormWithMultipleFields = () => (
      <div>
        <div data-testid="first-container">
          <AutoForm
            schema={new ZodBridge({ schema })}
            model={{ tagIds: ["tag1", "tag2"] }}
            onSubmit={() => {}}
          >
            <HasManyField
              name="tagIds"
              objectType="Movie"
              options={tagOptions}
              reference={referenceMetadata}
            />
          </AutoForm>
        </div>
        <div data-testid="second-container">
          <AutoForm
            schema={new ZodBridge({ schema })}
            model={{ tagIds: ["tag3", "tag4"] }}
            onSubmit={() => {}}
          >
            <HasManyField
              name="tagIds"
              objectType="Movie"
              options={tagOptions}
              reference={referenceMetadata}
            />
          </AutoForm>
        </div>
      </div>
    );

    mount(<TestFormWithMultipleFields />);

    // Create field interactables with different parent elements
    const firstField = hasManyField("tagIds", "Movie", () =>
      cy.get('[data-testid="first-container"]')
    );

    const secondField = hasManyField("tagIds", "Movie", () =>
      cy.get('[data-testid="second-container"]')
    );

    // Verify each field has the correct values
    // Use cy.wait to ensure the component has fully rendered
    cy.wait(100);

    // Check first field
    firstField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Action")
      .should("contain.text", "Comedy");

    // Check second field
    secondField
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Drama")
      .should("contain.text", "Sci-Fi");
  });

  it("should handle error state", () => {
    // Mount a basic form first
    mount(
      <AutoForm
        schema={new ZodBridge({ schema })}
        model={{ tagIds: ["tag1", "tag2"] }}
        onSubmit={() => {}}
      >
        <HasManyField
          name="tagIds"
          objectType="Movie"
          options={tagOptions}
          reference={referenceMetadata}
        />
      </AutoForm>
    );

    const field = hasManyField("tagIds", "Movie");

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
        errorMessage.textContent = "Invalid tags";
        $el.append(errorMessage);

        // Now check error state
        field.hasError().should("be.true");
        field.getErrorMessage().should("eq", "Invalid tags");
      });
  });

  it("should add and remove individual items", () => {
    const onChangeSpy = cy.spy().as("onChange");

    mount(<TestForm initialValue={["tag1"]} onChange={onChangeSpy} />);

    const field = hasManyField("tagIds", "Movie");

    // Initial state
    field.getSelectedValues().should("deep.equal", ["tag1"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Action");

    // Add a new tag
    field.openDropdown();
    field.selectByText("Comedy");

    // Should now have both tags
    cy.get("@onChange").should("have.been.calledWith", ["tag1", "tag2"]);
    field.getSelectedValues().should("deep.equal", ["tag1", "tag2"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Action");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Comedy");

    // Remove by selecting again (deselecting)
    field.openDropdown();
    field.getItemByName("Action").then((item) => {
      if (item) {
        item.click();
      }
    });
    field.closeDropdown();

    // Should only have the second tag now
    cy.get("@onChange").should("have.been.calledWith", ["tag2"]);
    field.getSelectedValues().should("deep.equal", ["tag2"]);

    // Verify the selected text by checking the combobox content
    field
      .getElement()
      .find('[role="combobox"]')
      .should("contain.text", "Comedy");
    field
      .getElement()
      .find('[role="combobox"]')
      .should("not.contain.text", "Action");
  });
});
