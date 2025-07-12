// BelongsToField.cy.tsx
// Tests for the BelongsToField component

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
import { belongsToField } from "../../../cypress/interactables/FormWithReferences/BelongsToField.interactable";
import BelongsToField from "./BelongsToField";
import { ObjectProvider } from "./ObjectProvider";
import { ObjectSchemaProvider } from "./ObjectSchemaContext";

describe("BelongsToField Component", () => {
  // Sample data for testing
  const worldOptions = [
    { _id: "world1", name: "Test World 1" },
    { _id: "world2", name: "Test World 2" },
    { _id: "world3", name: "Test World 3" },
  ];

  // Define reference metadata for testing
  const referenceMetadata = {
    name: "world",
    type: RelationshipType.BELONGS_TO,
    foreignField: "_id",
    options: worldOptions,
  };

  // Create a simple schema for the field
  const schema = z.object({
    worldId: z.string().optional(),
  });

  const TestForm = ({
    disabled = false,
    required = false,
    initialValue = "",
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
      <ObjectSchemaProvider schema={schema} objectType="World">
        <AutoForm
          schema={new ZodBridge({ schema })}
          model={{ worldId: value }}
          onSubmit={() => {}}
        >
          <BelongsToField
            name="worldId"
            disabled={disabled}
            required={required}
            onChange={handleChange}
            options={worldOptions}
            reference={referenceMetadata}
            value={value}
            error={error}
            errorMessage={errorMessage}
            objectId={objectId}
          />
        </AutoForm>
      </ObjectSchemaProvider>
    );
  };

  describe("Component Specific Functionality", () => {
    it("should set data-testid to 'BelongsToField'", () => {
      mount(<TestForm />);

      // Verify the data-testid attribute is set correctly
      cy.get('[data-testid="BelongsToField"]').should("exist");
    });
  });

  describe("Context Integration", () => {
    it("should use schema and objectType from context", () => {
      // Create a component without explicitly providing schema and objectType
      const ContextTestComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="World">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ worldId: value }}
              onSubmit={() => {}}
            >
              <BelongsToField
                name="worldId"
                onChange={setValue}
                reference={referenceMetadata}
                value={value}
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<ContextTestComponent />);

      const field = belongsToField("worldId", "World");
      field.label().should("contain", "World");
    });

    it("should use provided schema and objectType over context", () => {
      // Create a schema and objectType that differ from the context
      const customSchema = z.object({
        planetId: z.string().optional(),
      });

      // Create a component with explicitly provided schema and objectType
      const OverrideContextComponent = () => {
        const [value, setValue] = useState("");
        return (
          <ObjectSchemaProvider schema={schema} objectType="World">
            <AutoForm
              schema={new ZodBridge({ schema })}
              model={{ worldId: value }}
              onSubmit={() => {}}
            >
              <BelongsToField
                name="worldId"
                onChange={setValue}
                reference={referenceMetadata}
                value={value}
                schema={customSchema}
                objectType="Planet"
              />
            </AutoForm>
          </ObjectSchemaProvider>
        );
      };

      mount(<OverrideContextComponent />);

      const field = belongsToField("worldId", "Planet");
      field.label().should("contain", "World"); // Label should still come from reference metadata
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

    it.only("should properly hydrate initial values from Redux store", () => {
      // Create a real Redux store
      const store = createRealStore();

      // Add a spy to the dispatch function to track updates
      const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

      // Initial data with a world selected
      const initialWorldData = {
        name: "My World",
        description: "This is a test world",
        worldId: "world2", // Test World 2
      };

      // Initialize store with data
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "main",
          data: initialWorldData,
          objectId: "world-123",
        },
      });

      // Log the initial state to verify it's set correctly
      cy.log("Initial Redux State", JSON.stringify(store.getState()));

      // Create selectors for the Redux store
      const dataSelector = () => store.getState().objectData.main?.data || {};
      const objectIdSelector = () => store.getState().objectData.main?.objectId;

      // Create a schema with references
      const worldSchema = z
        .object({
          _id: z.string().describe("ID"),
          name: z.string().describe("Name"),
        })
        .describe("World");

      const projectSchema = z
        .object({
          name: z.string().describe("Name"),
          description: z.string().describe("Description"),
          worldId: z
            .string()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: worldSchema,
              name: "world",
            })
            .describe("World"),
        })
        .describe("Project");

      // Create a component to display the current Redux state
      const ReduxStateDisplay = () => {
        return (
          <div data-testid="redux-state">
            {JSON.stringify(store.getState().objectData.main?.data.worldId)}
          </div>
        );
      };

      // Import useSelector explicitly to ensure it's properly typed
      const { useSelector } = require("react-redux");

      // Create a component that will re-render when Redux state changes
      const WorldDisplay = () => {
        // Use useSelector to subscribe to Redux state changes
        const worldId = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.worldId
        );
        return (
          <div data-testid="world-display">
            Selected World: {JSON.stringify(worldId)}
          </div>
        );
      };

      // Create a wrapper component that uses Redux
      function TestProjectFormWithRedux() {
        return (
          <Provider store={store}>
            <div>
              <ObjectProvider
                schema={schema}
                objectType="Project"
                data={{}} // Empty default data
                dataSelector={dataSelector}
                objectIdSelector={objectIdSelector}
                dispatch={store.dispatch}
                createUpdateAction={updateObjectData}
              >
                {/* Display component that subscribes to Redux state changes */}
                <div>
                  <WorldDisplay />
                </div>

                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{}}
                  onSubmit={() => {}}
                >
                  <BelongsToField
                    name="worldId"
                    reference={referenceMetadata}
                    options={worldOptions}
                    // Don't pass value directly from store.getState() - let the ObjectProvider handle it
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
      mount(<TestProjectFormWithRedux />);

      // Get the field using the interactable pattern
      const field = belongsToField("worldId", "Project");

      // Verify that the initial value from Redux is properly displayed
      field.selected().should("equal", "Test World 2");
    });

    it.only("should update Redux store and UI when selecting a new option", () => {
      // Create a real Redux store
      const store = createRealStore();

      // Add a spy to the dispatch function to track updates
      const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

      // Initial data with a world selected
      const initialWorldData = {
        name: "My World",
        description: "This is a test world",
        worldId: "world2", // Test World 2
      };

      // Initialize store with data
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "main",
          data: initialWorldData,
          objectId: "world-123",
        },
      });

      // Create selectors for the Redux store
      const dataSelector = () => store.getState().objectData.main?.data || {};
      const objectIdSelector = () => store.getState().objectData.main?.objectId;

      // Create a schema with references
      const worldSchema = z
        .object({
          _id: z.string().describe("ID"),
          name: z.string().describe("Name"),
        })
        .describe("World");

      const projectSchema = z
        .object({
          name: z.string().describe("Name"),
          description: z.string().describe("Description"),
          worldId: z
            .string()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: worldSchema,
              name: "world",
            })
            .describe("World"),
        })
        .describe("Project");

      // Create a component to display the current Redux state
      const ReduxStateDisplay = () => {
        return (
          <div data-testid="redux-state">
            {JSON.stringify(store.getState().objectData.main?.data.worldId)}
          </div>
        );
      };

      // Import useSelector explicitly to ensure it's properly typed
      const { useSelector } = require("react-redux");

      // Create a component that will re-render when Redux state changes
      const WorldDisplay = () => {
        // Use useSelector to subscribe to Redux state changes
        const worldId = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.worldId
        );
        return (
          <div data-testid="world-display">
            Selected World: {JSON.stringify(worldId)}
          </div>
        );
      };

      // Create a wrapper component that uses Redux
      function TestProjectFormWithRedux() {
        return (
          <Provider store={store}>
            <div>
              <ObjectProvider
                schema={schema}
                objectType="Project"
                data={{}} // Empty default data
                dataSelector={dataSelector}
                objectIdSelector={objectIdSelector}
                dispatch={store.dispatch}
                createUpdateAction={updateObjectData}
              >
                {/* Display component that subscribes to Redux state changes */}
                <div>
                  <WorldDisplay />
                </div>

                <AutoForm
                  schema={new ZodBridge({ schema })}
                  model={{}}
                  onSubmit={() => {}}
                >
                  <BelongsToField
                    name="worldId"
                    reference={referenceMetadata}
                    options={worldOptions}
                    // Don't pass value directly from store.getState() - let the ObjectProvider handle it
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
      mount(<TestProjectFormWithRedux />);

      // Get the field using the interactable pattern
      const field = belongsToField("worldId", "Project");

      // Verify that the initial value from Redux is properly displayed
      field.selected().should("equal", "Test World 2");

      // Select a different world
      field.select("Test World 3");

      // Verify the dispatch was called with the correct action
      cy.get("@dispatchSpy").should("have.been.called");

      // Wait for the WorldDisplay component to update, which indicates the Redux state has changed
      // and the UI should reflect the new state
      cy.get('[data-testid="world-display"]').should("contain", "world3");

      // Click away from the field to ensure the selection is committed in the UI
      // This simulates a user clicking elsewhere after making a selection
      cy.get("body").click(0, 0);

      // Now verify the UI shows the new selection
      field.selected().should("equal", "Test World 3");
    });
  });
});
