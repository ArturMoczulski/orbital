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
import { ObjectSchemaProvider } from "../../../src/components/FormWithReferences/ObjectSchemaContext";
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
      <ObjectSchemaProvider schema={formSchema} objectType="Movie">
        <AutoForm
          schema={new ZodBridge({ schema: formSchema })}
          model={{ tagIds: value }}
          onSubmit={() => {}}
        >
          <HasManyField
            name="tagIds"
            disabled={disabled}
            required={required}
            options={tagOptions}
            onChange={handleChange}
            reference={referenceMetadata}
          />
        </AutoForm>
      </ObjectSchemaProvider>
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
      <ObjectSchemaProvider schema={schema} objectType="Movie">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ tagIds: [] }}
          onSubmit={() => {}}
        >
          <HasManyField
            name="tagIds"
            reference={{
              ...referenceMetadata,
              options: [],
            }}
          />
        </AutoForm>
      </ObjectSchemaProvider>
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
          <ObjectSchemaProvider schema={schema} objectType="Movie">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ tagIds: ["tag1", "tag2"] }}
              onSubmit={() => {}}
            >
              <HasManyField
                name="tagIds"
                options={tagOptions}
                reference={referenceMetadata}
              />
            </AutoForm>
          </ObjectSchemaProvider>
        </div>
        <div data-testid="second-container">
          <ObjectSchemaProvider schema={schema} objectType="Movie">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ tagIds: ["tag3", "tag4"] }}
              onSubmit={() => {}}
            >
              <HasManyField
                name="tagIds"
                options={tagOptions}
                reference={referenceMetadata}
              />
            </AutoForm>
          </ObjectSchemaProvider>
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
      <ObjectSchemaProvider schema={schema} objectType="Movie">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ tagIds: ["tag1", "tag2"] }}
          onSubmit={() => {}}
        >
          <HasManyField
            name="tagIds"
            options={tagOptions}
            reference={referenceMetadata}
          />
        </AutoForm>
      </ObjectSchemaProvider>
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

  describe("Multiple HasManyFields on the same page", () => {
    // Sample data for testing
    const tagOptions = [
      { _id: "tag1", name: "Action" },
      { _id: "tag2", name: "Comedy" },
      { _id: "tag3", name: "Drama" },
      { _id: "tag4", name: "Sci-Fi" },
    ];

    const genreOptions = [
      { _id: "genre1", name: "Fiction" },
      { _id: "genre2", name: "Non-Fiction" },
      { _id: "genre3", name: "Biography" },
      { _id: "genre4", name: "History" },
    ];

    // Define reference metadata for testing
    const tagReferenceMetadata = {
      name: "tag",
      type: RelationshipType.HAS_MANY,
      foreignField: "_id",
      options: tagOptions,
    };

    const genreReferenceMetadata = {
      name: "genre",
      type: RelationshipType.HAS_MANY,
      foreignField: "_id",
      options: genreOptions,
    };

    it("should handle same object type but different IDs", () => {
      // Create a test component with two fields of the same object type but different IDs
      const TestFormWithSameTypeFields = () => {
        const [movie1Tags, setMovie1Tags] = useState(["tag1", "tag2"]);
        const [movie2Tags, setMovie2Tags] = useState(["tag3", "tag4"]);

        return (
          <div>
            <div data-testid="movie1-container">
              <ObjectSchemaProvider schema={schema} objectType="Movie">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ tagIds: movie1Tags }}
                  onSubmit={() => {}}
                >
                  <HasManyField
                    name="tagIds"
                    options={tagOptions}
                    reference={tagReferenceMetadata}
                    objectId="movie-1"
                    onChange={(newValue) => setMovie1Tags(newValue)}
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
            <div data-testid="movie2-container">
              <ObjectSchemaProvider schema={schema} objectType="Movie">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ tagIds: movie2Tags }}
                  onSubmit={() => {}}
                >
                  <HasManyField
                    name="tagIds"
                    options={tagOptions}
                    reference={tagReferenceMetadata}
                    objectId="movie-2"
                    onChange={(newValue) => setMovie2Tags(newValue)}
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
        );
      };

      mount(<TestFormWithSameTypeFields />);

      // Create parent-scoped interactables for each container
      const movie1Container = () => cy.get('[data-testid="movie1-container"]');
      const movie2Container = () => cy.get('[data-testid="movie2-container"]');

      // Log the HTML structure to debug data-object-id attribute
      movie1Container().then(($el) => {
        cy.log("Movie 1 Container HTML:");
        cy.log($el.html());

        // Check if data-object-id is present
        const hasObjectId = $el.find('[data-object-id="movie-1"]').length > 0;
        cy.log(`Has data-object-id="movie-1": ${hasObjectId}`);

        // Log all data attributes for debugging
        const dataAttrs = [];

        // Find all elements in the container
        $el.find("*").each((i, el) => {
          const attrs = el.attributes;
          const dataAttrObj = {};
          let hasDataAttr = false;

          for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name.startsWith("data-")) {
              dataAttrObj[attrs[i].name] = attrs[i].value;
              hasDataAttr = true;
            }
          }

          // Only add elements that have at least one data attribute
          if (hasDataAttr) {
            dataAttrs.push(dataAttrObj);
          }
        });

        cy.log("All data attributes found:");
        cy.log(JSON.stringify(dataAttrs, null, 2));
      });

      // Log the selector that will be used
      cy.log("Selector that will be used for movie1Field:");
      cy.log(
        `[data-testid="HasManyField"][data-field-name="tagIds"][data-object-id="movie-1"]`
      );

      // Create field interactables with the same object type but different IDs
      const movie1Field = hasManyField(
        "tagIds",
        "Movie",
        movie1Container,
        "movie-1"
      );
      const movie2Field = hasManyField(
        "tagIds",
        "Movie",
        movie2Container,
        "movie-2"
      );

      // Verify each field has the correct values
      cy.wait(100); // Wait for the component to fully render

      // Debug: Check if the element can be found directly with the selector
      movie1Container().within(() => {
        cy.get(
          '[data-testid="HasManyField"][data-field-name="tagIds"][data-object-id="movie-1"]'
        ).then(($el) => {
          cy.log(`Direct selector found ${$el.length} elements`);
        });
      });

      // Check first field
      movie1Field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Action")
        .should("contain.text", "Comedy");

      // Check second field
      movie2Field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Drama")
        .should("contain.text", "Sci-Fi");

      // Test interactions with each field
      movie1Field.selectById(["tag3"]);
      movie2Field.selectById(["tag1"]);

      // Verify the values were updated correctly
      movie1Field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Drama")
        .should("not.contain.text", "Action")
        .should("not.contain.text", "Comedy");

      movie2Field
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Action")
        .should("not.contain.text", "Drama")
        .should("not.contain.text", "Sci-Fi");
    });

    it("should handle different object types but same IDs", () => {
      // Create a schema for the genre field
      const genreSchema = z.object({
        genreIds: z.array(z.string()).optional(),
      });

      // Create a test component with fields of different object types but same IDs
      const TestFormWithDifferentTypeFields = () => {
        const [movieTags, setMovieTags] = useState(["tag1", "tag2"]);
        const [bookGenres, setBookGenres] = useState(["genre1", "genre2"]);

        return (
          <div>
            <div data-testid="movie-container">
              <ObjectSchemaProvider schema={schema} objectType="Movie">
                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{ tagIds: movieTags }}
                  onSubmit={() => {}}
                >
                  <HasManyField
                    name="tagIds"
                    options={tagOptions}
                    reference={tagReferenceMetadata}
                    objectId="shared-id-123"
                    onChange={(newValue) => setMovieTags(newValue)}
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
            <div data-testid="book-container">
              <ObjectSchemaProvider schema={genreSchema} objectType="Book">
                <AutoForm
                  schema={new ZodBridge({ schema: genreSchema })}
                  model={{ genreIds: bookGenres }}
                  onSubmit={() => {}}
                >
                  <HasManyField
                    name="genreIds"
                    options={genreOptions}
                    reference={genreReferenceMetadata}
                    objectId="shared-id-123"
                    onChange={(newValue) => setBookGenres(newValue)}
                  />
                </AutoForm>
              </ObjectSchemaProvider>
            </div>
          </div>
        );
      };

      mount(<TestFormWithDifferentTypeFields />);

      // Create parent-scoped interactables for each container
      const movieContainer = () => cy.get('[data-testid="movie-container"]');
      const bookContainer = () => cy.get('[data-testid="book-container"]');

      // Create field interactables with different object types but the same ID
      const movieField = hasManyField(
        "tagIds",
        "Movie",
        movieContainer,
        "shared-id-123"
      );
      const bookField = hasManyField(
        "genreIds",
        "Book",
        bookContainer,
        "shared-id-123"
      );

      // Verify each field has the correct values
      cy.wait(100); // Wait for the component to fully render

      // Check movie field
      movieField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Action")
        .should("contain.text", "Comedy");

      // Check book field
      bookField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Fiction")
        .should("contain.text", "Non-Fiction");

      // Test interactions with each field
      movieField.selectById(["tag3"]);
      bookField.selectById(["genre3"]);

      // Verify the values were updated correctly
      movieField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Drama")
        .should("not.contain.text", "Action")
        .should("not.contain.text", "Comedy");

      bookField
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Biography")
        .should("not.contain.text", "Fiction")
        .should("not.contain.text", "Non-Fiction");
    });

    it("should handle parent element and objectId together", () => {
      // Create a test component with multiple fields of the same type and ID
      const TestFormWithMultipleFields = () => {
        const [movie1Tags, setMovie1Tags] = useState(["tag1", "tag2"]);
        const [movie2Tags, setMovie2Tags] = useState(["tag3", "tag4"]);

        return (
          <div>
            <div data-testid="container-1">
              <div data-testid="movie-1">
                <ObjectSchemaProvider schema={schema} objectType="Movie">
                  <AutoForm
                    schema={new ZodBridge({ schema })}
                    model={{ tagIds: movie1Tags }}
                    onSubmit={() => {}}
                  >
                    <HasManyField
                      name="tagIds"
                      options={tagOptions}
                      reference={tagReferenceMetadata}
                      objectId="movie-id-1"
                      onChange={(newValue) => setMovie1Tags(newValue)}
                    />
                  </AutoForm>
                </ObjectSchemaProvider>
              </div>
            </div>
            <div data-testid="container-2">
              <div data-testid="movie-1">
                <ObjectSchemaProvider schema={schema} objectType="Movie">
                  <AutoForm
                    schema={new ZodBridge({ schema })}
                    model={{ tagIds: movie2Tags }}
                    onSubmit={() => {}}
                  >
                    <HasManyField
                      name="tagIds"
                      options={tagOptions}
                      reference={tagReferenceMetadata}
                      objectId="movie-id-1"
                      onChange={(newValue) => setMovie2Tags(newValue)}
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
      const field1 = hasManyField(
        "tagIds",
        "Movie",
        () => cy.get('[data-testid="container-1"]'),
        "movie-id-1"
      );
      const field2 = hasManyField(
        "tagIds",
        "Movie",
        () => cy.get('[data-testid="container-2"]'),
        "movie-id-1"
      );

      // Verify each field has the correct values
      cy.wait(100); // Wait for the component to fully render

      // Check first field
      field1
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Action")
        .should("contain.text", "Comedy");

      // Check second field
      field2
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Drama")
        .should("contain.text", "Sci-Fi");

      // Test interactions with each field
      field1.selectById(["tag3"]);
      field2.selectById(["tag1"]);

      // Verify the values were updated correctly
      field1
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Drama")
        .should("not.contain.text", "Action")
        .should("not.contain.text", "Comedy");

      field2
        .getElement()
        .find('[role="combobox"]')
        .should("contain.text", "Action")
        .should("not.contain.text", "Drama")
        .should("not.contain.text", "Sci-Fi");
    });
  });
});
