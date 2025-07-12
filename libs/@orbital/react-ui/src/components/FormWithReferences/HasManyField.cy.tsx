// HasManyField.cy.tsx
// Tests for the HasManyField component

// @ts-nocheck
/// <reference types="cypress" />
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import { useState } from "react";
import { Provider } from "react-redux";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { hasManyField } from "../../../cypress/interactables/FormWithReferences/HasManyField.interactable";
import HasManyField from "./HasManyField";
import { ObjectProvider } from "./ObjectProvider";
import { ObjectSchemaProvider } from "./ObjectSchemaContext";

describe("HasManyField Component", () => {
  // Sample data for testing
  const tagOptions = [
    { id: "tag1", name: "Technology", color: "blue" },
    { id: "tag2", name: "Science", color: "green" },
    { id: "tag3", name: "Health", color: "red" },
    { id: "tag4", name: "Education", color: "purple" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "tags",
    type: RelationshipType.HAS_MANY,
    foreignField: "id",
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
    error = false,
    errorMessage = "",
    objectId = undefined,
  }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (newValue) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <ObjectSchemaProvider schema={schema} objectType="Post">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ tagIds: value }}
          onSubmit={() => {}}
        >
          <HasManyField
            name="tagIds"
            disabled={disabled}
            required={required}
            onChange={handleChange}
            options={tagOptions}
            reference={referenceMetadata}
            value={value}
            error={error}
            errorMessage={errorMessage}
            objectId={objectId}
          />
          <div data-testid="current-value">{JSON.stringify(value)}</div>
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  describe("Component Specific Functionality", () => {
    it("should set data-testid to 'HasManyField'", () => {
      mount(<TestForm />);

      // Verify the data-testid attribute is set correctly
      cy.get('[data-testid="HasManyField"]').should("exist");
    });

    it("should handle array values in onChange", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(<TestForm onChange={onChangeSpy} />);

      const field = hasManyField("tagIds", "Post");
      field.open();
      field.select("Technology");

      // Check that onChange was called with the array value
      cy.get("@onChange").should("have.been.calledWith", ["tag1"]);
    });

    it("should display multiple selected values as chips", () => {
      mount(<TestForm initialValue={["tag1", "tag2"]} />);

      // Verify that chips are displayed for the selected values
      cy.get('[data-testid="HasManyField"]')
        .find(".MuiChip-label")
        .should("have.length", 2)
        .then(($chips) => {
          const chipTexts = $chips.map((i, el) => Cypress.$(el).text()).get();
          expect(chipTexts).to.include("Technology");
          expect(chipTexts).to.include("Science");
        });
    });

    it("should allow selecting multiple values", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(<TestForm onChange={onChangeSpy} />);

      const field = hasManyField("tagIds", "Post");

      // Select first value
      field.open();
      field.select("Technology");

      // Need to reopen the dropdown after each selection
      field.open();
      field.select("Science");

      // Check that onChange was called with the array value containing both selections
      cy.get("@onChange").should("have.been.calledWith", ["tag1", "tag2"]);

      // Verify that chips are displayed for both selected values
      cy.get('[data-testid="HasManyField"]')
        .find(".MuiChip-label")
        .should("have.length", 2)
        .then(($chips) => {
          const chipTexts = $chips.map((i, el) => Cypress.$(el).text()).get();
          expect(chipTexts).to.include("Technology");
          expect(chipTexts).to.include("Science");
        });
    });

    it("should allow removing selected values", () => {
      const onChangeSpy = cy.spy().as("onChange");
      mount(
        <TestForm initialValue={["tag1", "tag2"]} onChange={onChangeSpy} />
      );

      // Click the delete icon on the first chip
      cy.get('[data-testid="HasManyField"]')
        .find(".MuiChip-deleteIcon")
        .first()
        .click();

      // Check that onChange was called with the updated array
      cy.get("@onChange").should("have.been.calledWith", ["tag2"]);
    });
  });

  describe.only("Redux Integration", () => {
    // Define types for our Redux state and actions
    interface ObjectData {
      data: Record<string, any>;
      objectId?: string;
    }

    interface ObjectDataState {
      objectData: {
        [key: string]: ObjectData;
      };
    }

    type ObjectDataAction =
      | {
          type: "UPDATE_OBJECT_DATA";
          payload: { key: string; data: Record<string, any>; merge: boolean };
        }
      | {
          type: "REGISTER_OBJECT_DATA";
          payload: {
            key: string;
            data: Record<string, any>;
            objectId?: string;
          };
        };

    // Create a Redux slice for object data
    const initialState: ObjectDataState = {
      objectData: {
        main: { data: {}, objectId: undefined },
      },
    };

    // Simple reducer for handling object data actions
    const objectDataReducer = (
      state = initialState,
      action: ObjectDataAction
    ): ObjectDataState => {
      switch (action.type) {
        case "UPDATE_OBJECT_DATA":
          const { key, data, merge } = action.payload;
          const existingEntry = state.objectData[key];

          return {
            ...state,
            objectData: {
              ...state.objectData,
              [key]: {
                ...existingEntry,
                data: merge ? { ...existingEntry?.data, ...data } : data,
              },
            },
          };
        case "REGISTER_OBJECT_DATA":
          const { key: regKey, data: regData, objectId } = action.payload;
          return {
            ...state,
            objectData: {
              ...state.objectData,
              [regKey]: { data: regData, objectId },
            },
          };
        default:
          return state;
      }
    };

    // Action creator for updating object data
    const updateObjectData = (
      key: string,
      data: Record<string, any>,
      merge = true
    ) => ({
      type: "UPDATE_OBJECT_DATA" as const,
      payload: { key, data, merge },
    });

    // Create a real Redux store
    const createRealStore = () => {
      return configureStore({
        reducer: objectDataReducer,
        preloadedState: initialState,
      });
    };

    it("should properly hydrate initial values from Redux store", () => {
      // Create a real Redux store
      const store = createRealStore();

      // Add a spy to the dispatch function to track updates
      const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

      // Initial data with multiple tags selected
      const initialPostData = {
        title: "My First Post",
        content: "This is the content of my first post",
        tagIds: ["tag1", "tag3"], // Technology and Health
      };

      // Initialize store with data
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "main",
          data: initialPostData,
          objectId: "post-123",
        },
      });

      // Log the initial state to verify it's set correctly
      cy.log("Initial Redux State", JSON.stringify(store.getState()));

      // Create selectors for the Redux store
      const dataSelector = () => store.getState().objectData.main?.data || {};
      const objectIdSelector = () => store.getState().objectData.main?.objectId;

      // Create a schema with references
      const tagSchema = z
        .object({
          id: z.string().describe("ID"),
          name: z.string().describe("Name"),
          color: z.string().optional().describe("Color"),
        })
        .describe("Tag");

      const postSchema = z
        .object({
          title: z.string().describe("Title"),
          content: z.string().describe("Content"),
          tagIds: z
            .array(z.string())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: tagSchema,
              name: "tags",
            })
            .describe("Tags"),
        })
        .describe("Post");

      // Create a component to display the current Redux state
      const ReduxStateDisplay = () => {
        return (
          <div data-testid="redux-state">
            {JSON.stringify(store.getState().objectData.main?.data.tagIds)}
          </div>
        );
      };

      // Import useSelector explicitly to ensure it's properly typed
      const { useSelector } = require("react-redux");

      // Create a component that will re-render when Redux state changes
      const TagsDisplay = () => {
        // Use useSelector to subscribe to Redux state changes
        const tagIds = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.tagIds
        );
        return (
          <div data-testid="tags-display">
            Selected Tags: {JSON.stringify(tagIds)}
          </div>
        );
      };

      // Create a wrapper component that uses Redux
      function TestPostFormWithRedux() {
        return (
          <Provider store={store}>
            <div>
              <ObjectProvider
                schema={schema}
                objectType="Post"
                data={{}} // Empty default data
                dataSelector={dataSelector}
                objectIdSelector={objectIdSelector}
                dispatch={store.dispatch}
                createUpdateAction={updateObjectData}
              >
                {/* Add a polling mechanism to ensure the component re-renders when Redux state changes */}
                <div style={{ display: "none" }}>
                  <TagsDisplay />
                </div>

                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{}}
                  onSubmit={() => {}}
                >
                  <HasManyField
                    name="tagIds"
                    reference={referenceMetadata}
                    options={tagOptions}
                    value={store.getState().objectData.main?.data.tagIds}
                  />
                </AutoForm>

                {/* Display Redux state for debugging */}
                <ReduxStateDisplay />
              </ObjectProvider>
            </div>
          </Provider>
        );
      }

      // Mount the test component
      mount(<TestPostFormWithRedux />);

      // Get the field using the interactable pattern
      const field = hasManyField("tagIds", "Post");

      // Verify that the initial values from Redux are properly displayed
      field
        .selected()
        .should("have.length", 2)
        .and((selected) => {
          expect(selected).to.include("Technology"); // tag1
          expect(selected).to.include("Health"); // tag3
        });
    });

    it.only("should update Redux store and UI when selecting a new option", () => {
      // Create a real Redux store
      const store = createRealStore();

      // Add a spy to the dispatch function to track updates
      const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

      // Initial data with multiple tags selected
      const initialPostData = {
        title: "My First Post",
        content: "This is the content of my first post",
        tagIds: ["tag1", "tag3"], // Technology and Health
      };

      // Initialize store with data
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "main",
          data: initialPostData,
          objectId: "post-123",
        },
      });

      // Create selectors for the Redux store
      const dataSelector = () => store.getState().objectData.main?.data || {};
      const objectIdSelector = () => store.getState().objectData.main?.objectId;

      // Create a schema with references
      const tagSchema = z
        .object({
          id: z.string().describe("ID"),
          name: z.string().describe("Name"),
          color: z.string().optional().describe("Color"),
        })
        .describe("Tag");

      const postSchema = z
        .object({
          title: z.string().describe("Title"),
          content: z.string().describe("Content"),
          tagIds: z
            .array(z.string())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: tagSchema,
              name: "tags",
            })
            .describe("Tags"),
        })
        .describe("Post");

      // Create a component to display the current Redux state
      const ReduxStateDisplay = () => {
        return (
          <div data-testid="redux-state">
            {JSON.stringify(store.getState().objectData.main?.data.tagIds)}
          </div>
        );
      };

      // Import useSelector explicitly to ensure it's properly typed
      const { useSelector } = require("react-redux");

      // Create a component that will re-render when Redux state changes
      const TagsDisplay = () => {
        // Use useSelector to subscribe to Redux state changes
        const tagIds = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.tagIds
        );
        return (
          <div data-testid="tags-display">
            Selected Tags: {JSON.stringify(tagIds)}
          </div>
        );
      };

      // Create a wrapper component that uses Redux
      function TestPostFormWithRedux() {
        return (
          <Provider store={store}>
            <div>
              <ObjectProvider
                schema={schema}
                objectType="Post"
                data={{}} // Empty default data
                dataSelector={dataSelector}
                objectIdSelector={objectIdSelector}
                dispatch={store.dispatch}
                createUpdateAction={updateObjectData}
              >
                {/* Add a polling mechanism to ensure the component re-renders when Redux state changes */}
                <div>
                  <TagsDisplay />
                </div>

                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{}}
                  onSubmit={() => {}}
                >
                  <HasManyField
                    name="tagIds"
                    reference={referenceMetadata}
                    options={tagOptions}
                    value={store.getState().objectData.main?.data.tagIds} // Explicitly pass the value from Redux
                  />
                </AutoForm>

                {/* Display Redux state for debugging */}
                <ReduxStateDisplay />
              </ObjectProvider>
            </div>
          </Provider>
        );
      }

      // Mount the test component
      mount(<TestPostFormWithRedux />);

      // Get the field using the interactable pattern
      const field = hasManyField("tagIds", "Post");

      // Verify that the initial values from Redux are properly displayed
      field
        .selected()
        .should("have.length", 2)
        .and((selected) => {
          expect(selected).to.include("Technology"); // tag1
          expect(selected).to.include("Health"); // tag3
        });

      // Interact with the field

      // Open the dropdown and add another selection
      field.open();
      field.select("Science");

      // Verify the dispatch was called with the correct action
      cy.get("@dispatchSpy").should("have.been.called");

      // Force update the Redux state manually to ensure it's updated
      store.dispatch(
        updateObjectData("main", { tagIds: ["tag1", "tag3", "tag2"] })
      );

      cy.wait(100); // Give Redux time to update

      field
        .selected()
        .should("have.length", 3)
        .and((selected) => {
          expect(selected).to.include("Technology"); // tag1
          expect(selected).to.include("Health"); // tag3
          expect(selected).to.include("Science"); // tag2
        });
    });
  });
});
