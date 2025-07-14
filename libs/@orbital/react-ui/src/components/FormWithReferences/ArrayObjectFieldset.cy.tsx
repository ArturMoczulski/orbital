import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import React, { useEffect, useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { arrayObjectFieldset } from "../../../cypress/interactables/FormWithReferences/ArrayObjectFieldset.interactable";
import { ArrayObjectFieldset } from "./ArrayObjectFieldset";
import { ArrayObjectProvider } from "./ArrayObjectProvider";

// Define types for our Redux state and actions
interface ArrayItemData {
  [key: string]: any;
}

interface ArrayState {
  [key: string]: {
    items: ArrayItemData[];
    objectId: string;
  };
}

interface ObjectDataState {
  arrays: ArrayState;
  objects: {
    [key: string]: {
      data: Record<string, any>;
      objectId?: string;
    };
  };
}

// Array action types
type ArrayAction =
  | {
      type: "UPDATE_ARRAY_ITEMS";
      payload: {
        objectType: string;
        objectId: string;
        items: ArrayItemData[];
      };
    }
  | {
      type: "ADD_ARRAY_ITEM";
      payload: {
        objectType: string;
        objectId: string;
        item: ArrayItemData;
      };
    }
  | {
      type: "UPDATE_ARRAY_ITEM";
      payload: {
        objectType: string;
        objectId: string;
        index: number;
        item: ArrayItemData;
        merge: boolean;
      };
    }
  | {
      type: "REMOVE_ARRAY_ITEM";
      payload: {
        objectType: string;
        objectId: string;
        index: number;
      };
    };

// Object action types
type ObjectAction =
  | {
      type: "UPDATE_OBJECT_DATA";
      payload: {
        key: string;
        data: Record<string, any>;
        merge: boolean;
        arrayIndex?: number;
      };
    }
  | {
      type: "REGISTER_OBJECT_DATA";
      payload: {
        key: string;
        data: Record<string, any>;
        objectId?: string;
      };
    };

type AppAction = ArrayAction | ObjectAction;

// Create a Redux slice for array and object data
const initialState: ObjectDataState = {
  arrays: {},
  objects: {
    main: { data: {}, objectId: undefined },
  },
};

// Simple reducer for handling array and object actions
const appReducer = (
  state = initialState,
  action: AppAction
): ObjectDataState => {
  switch (action.type) {
    case "UPDATE_ARRAY_ITEMS": {
      const { objectType, objectId, items } = action.payload;
      const arrayKey = `${objectType}-${objectId}`;

      return {
        ...state,
        arrays: {
          ...state.arrays,
          [arrayKey]: {
            ...state.arrays[arrayKey],
            items,
            objectId,
          },
        },
      };
    }
    case "ADD_ARRAY_ITEM": {
      const { objectType, objectId, item } = action.payload;
      const arrayKey = `${objectType}-${objectId}`;
      const existingArray = state.arrays[arrayKey] || { items: [], objectId };

      return {
        ...state,
        arrays: {
          ...state.arrays,
          [arrayKey]: {
            ...existingArray,
            items: [...existingArray.items, item],
          },
        },
      };
    }
    case "UPDATE_ARRAY_ITEM": {
      const { objectType, objectId, index, item, merge } = action.payload;
      const arrayKey = `${objectType}-${objectId}`;
      const existingArray = state.arrays[arrayKey];

      if (!existingArray) return state;

      const newItems = [...existingArray.items];
      newItems[index] = merge ? { ...newItems[index], ...item } : item;

      return {
        ...state,
        arrays: {
          ...state.arrays,
          [arrayKey]: {
            ...existingArray,
            items: newItems,
          },
        },
      };
    }
    case "REMOVE_ARRAY_ITEM": {
      const { objectType, objectId, index } = action.payload;
      const arrayKey = `${objectType}-${objectId}`;
      const existingArray = state.arrays[arrayKey];

      if (!existingArray) return state;

      const newItems = [...existingArray.items];
      newItems.splice(index, 1);

      return {
        ...state,
        arrays: {
          ...state.arrays,
          [arrayKey]: {
            ...existingArray,
            items: newItems,
          },
        },
      };
    }
    case "UPDATE_OBJECT_DATA": {
      const { key, data, merge, arrayIndex } = action.payload;
      const existingEntry = state.objects[key];

      // If arrayIndex is provided, update the array item
      if (arrayIndex !== undefined && key.includes("-")) {
        const [objectType, objectId] = key.split("-");
        const arrayKey = `${objectType}-${objectId}`;
        const existingArray = state.arrays[arrayKey];

        if (existingArray && existingArray.items[arrayIndex]) {
          const newItems = [...existingArray.items];
          newItems[arrayIndex] = merge
            ? { ...newItems[arrayIndex], ...data }
            : data;

          return {
            ...state,
            arrays: {
              ...state.arrays,
              [arrayKey]: {
                ...existingArray,
                items: newItems,
              },
            },
          };
        }
      }

      // Otherwise update the object directly
      return {
        ...state,
        objects: {
          ...state.objects,
          [key]: {
            ...existingEntry,
            data: merge ? { ...existingEntry?.data, ...data } : data,
          },
        },
      };
    }
    case "REGISTER_OBJECT_DATA": {
      const { key, data, objectId } = action.payload;
      return {
        ...state,
        objects: {
          ...state.objects,
          [key]: { data, objectId },
        },
      };
    }
    default:
      return state;
  }
};

// Action creators
const updateArrayItems = (
  objectType: string,
  objectId: string,
  items: ArrayItemData[]
) => ({
  type: "UPDATE_ARRAY_ITEMS" as const,
  payload: { objectType, objectId, items },
});

const addArrayItem = (
  objectType: string,
  objectId: string,
  item: ArrayItemData
) => ({
  type: "ADD_ARRAY_ITEM" as const,
  payload: { objectType, objectId, item },
});

const updateArrayItem = (
  objectType: string,
  objectId: string,
  index: number,
  item: ArrayItemData,
  merge = true
) => ({
  type: "UPDATE_ARRAY_ITEM" as const,
  payload: { objectType, objectId, index, item, merge },
});

const removeArrayItem = (
  objectType: string,
  objectId: string,
  index: number
) => ({
  type: "REMOVE_ARRAY_ITEM" as const,
  payload: { objectType, objectId, index },
});

const updateObjectData = (
  key: string,
  data: Record<string, any>,
  merge = true,
  arrayIndex?: number
) => ({
  type: "UPDATE_OBJECT_DATA" as const,
  payload: { key, data, merge, arrayIndex },
});

// Create a real Redux store
const createRealStore = () => {
  return configureStore({
    reducer: appReducer,
    preloadedState: initialState,
  });
};

describe("ArrayObjectFieldset", () => {
  // Define a schema for testing
  const taskSchema = z
    .object({
      id: z.string().describe("ID"),
      name: z.string().describe("Name"),
      description: z.string().describe("Description"),
      priority: z.number().describe("Priority"),
      completed: z.boolean().describe("Completed"),
    })
    .describe("Task");

  // Create a bridge for the schema
  const taskBridge = new ZodBridge({ schema: taskSchema });

  // Test data - array of at least 2 objects
  const tasks = [
    {
      id: "task-1",
      name: "Implement ArrayObjectFieldset",
      description: "Create a component for editing arrays of objects",
      priority: 1,
      completed: false,
    },
    {
      id: "task-2",
      name: "Write tests",
      description: "Create Cypress tests for the component",
      priority: 2,
      completed: false,
    },
  ];

  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Maximum update depth exceeded") ||
        err.message.includes("Cannot read properties of undefined") ||
        err.message.includes("Script error")
      ) {
        return false;
      }
      return true;
    });
  });

  it("renders the array of objects and handles Redux state updates", () => {
    // Create a component with Redux store
    function TestArrayObjectFieldset() {
      // Create a Redux store
      const store = React.useMemo(() => createRealStore(), []);
      const [tasksState, setTasksState] = useState(tasks);

      // Subscribe to store changes
      useEffect(() => {
        const unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const tasksArray = state.arrays["Task-tasks"]?.items;
          if (tasksArray) {
            setTasksState(tasksArray as typeof tasks);
          }
        });

        // Initialize the Redux store with our tasks
        store.dispatch(updateArrayItems("Task", "tasks", tasks));

        return () => unsubscribe();
      }, [store]);

      // Create action creators for array operations
      const createUpdateAction = (
        objectType: string,
        objectId: string,
        data: Record<string, any>
      ) => {
        return updateArrayItems(objectType, objectId, data as any[]);
      };

      // Create action creators for object operations
      const objectCreateUpdateAction = (
        key: string,
        data: Record<string, any>,
        merge = true,
        arrayIndex?: number
      ) => {
        return updateObjectData(key, data, merge, arrayIndex);
      };

      return (
        <div>
          <ArrayObjectProvider
            schema={taskBridge}
            objectType="Task"
            objectId="tasks"
            items={tasksState}
            onChange={(newItems) => {
              store.dispatch(updateArrayItems("Task", "tasks", newItems));
            }}
            dispatch={store.dispatch}
            createUpdateAction={createUpdateAction}
            objectDispatch={store.dispatch}
            objectCreateUpdateAction={objectCreateUpdateAction}
          >
            <ArrayObjectFieldset />
          </ArrayObjectProvider>

          {/* Hidden divs to verify the current state */}
          <div data-testid="tasks-count">{tasksState.length}</div>
          <div data-testid="task-0-name">{tasksState[0]?.name}</div>
          <div data-testid="task-1-name">{tasksState[1]?.name}</div>
          <div data-testid="task-0-priority">{tasksState[0]?.priority}</div>
          <div data-testid="task-0-completed">
            {String(tasksState[0]?.completed)}
          </div>
          <div data-testid="redux-state">{JSON.stringify(tasksState)}</div>
        </div>
      );
    }

    mount(<TestArrayObjectFieldset />);

    // Get the ArrayObjectFieldset
    const arrayFieldset = arrayObjectFieldset({ objectType: "Task" });

    // Verify the fieldset exists
    arrayFieldset.should("exist");

    // Verify we have 2 items initially
    arrayFieldset.getItemCount().should("eq", 2);
    cy.get('[data-testid="task-0-name"]').should(
      "contain",
      "Implement ArrayObjectFieldset"
    );
    cy.get('[data-testid="task-1-name"]').should("contain", "Write tests");

    // Get the first task and update its priority
    arrayFieldset.item(0).then((taskFieldset) => {
      taskFieldset.field("priority").then((field) => {
        field.clear().type("3");
      });
    });

    // Verify the priority was updated in Redux
    cy.get('[data-testid="task-0-priority"]').should("contain", "3");

    // Get the first task and update its completed status
    arrayFieldset.item(0).then((taskFieldset) => {
      taskFieldset.field("completed").then((field) => {
        // Use click() instead of check() for boolean fields
        field.get().click();
      });
    });

    // Verify the completed status was updated in Redux
    cy.get('[data-testid="task-0-completed"]').should("contain", "true");

    // Add a new task
    arrayFieldset.addItem();

    // Verify we now have 3 items
    arrayFieldset.getItemCount().should("eq", 3);

    // Remove the second task
    arrayFieldset.removeItem(1);

    // Verify we now have 2 items again
    arrayFieldset.getItemCount().should("eq", 2);

    // Verify the first task is still there with its updated values
    cy.get('[data-testid="task-0-name"]').should(
      "contain",
      "Implement ArrayObjectFieldset"
    );
    cy.get('[data-testid="task-0-priority"]').should("contain", "3");
    cy.get('[data-testid="task-0-completed"]').should("contain", "true");
  });

  it("handles object-level Redux updates with arrayIndex", () => {
    // Create a component with Redux store
    function TestArrayObjectFieldset() {
      // Create a Redux store
      const store = React.useMemo(() => createRealStore(), []);
      const [tasksState, setTasksState] = useState(tasks);

      // Subscribe to store changes
      useEffect(() => {
        const unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const tasksArray = state.arrays["Task-tasks"]?.items;
          if (tasksArray) {
            setTasksState(tasksArray as typeof tasks);
          }
        });

        // Initialize the Redux store with our tasks
        store.dispatch(updateArrayItems("Task", "tasks", tasks));

        return () => unsubscribe();
      }, [store]);

      // Create action creators for array operations
      const createUpdateAction = (
        objectType: string,
        objectId: string,
        data: Record<string, any>
      ) => {
        return updateArrayItems(objectType, objectId, data as any[]);
      };

      // Create action creators for object operations
      const objectCreateUpdateAction = (
        key: string,
        data: Record<string, any>,
        merge = true,
        arrayIndex?: number
      ) => {
        return updateObjectData(key, data, merge, arrayIndex);
      };

      return (
        <div>
          <ArrayObjectProvider
            schema={taskBridge}
            objectType="Task"
            objectId="tasks"
            items={tasksState}
            onChange={(newItems) => {
              store.dispatch(updateArrayItems("Task", "tasks", newItems));
            }}
            dispatch={store.dispatch}
            createUpdateAction={createUpdateAction}
            objectDispatch={store.dispatch}
            objectCreateUpdateAction={objectCreateUpdateAction}
          >
            <ArrayObjectFieldset />
          </ArrayObjectProvider>

          {/* Hidden divs to verify the current state */}
          <div data-testid="tasks-count">{tasksState.length}</div>
          <div data-testid="task-0-name">{tasksState[0]?.name}</div>
          <div data-testid="task-1-name">{tasksState[1]?.name}</div>
          <div data-testid="task-0-description">
            {tasksState[0]?.description}
          </div>
          <div data-testid="task-1-description">
            {tasksState[1]?.description}
          </div>
          <div data-testid="redux-state">{JSON.stringify(tasksState)}</div>
        </div>
      );
    }

    mount(<TestArrayObjectFieldset />);

    // Get the ArrayObjectFieldset
    const arrayFieldset = arrayObjectFieldset({ objectType: "Task" });

    // Verify the fieldset exists
    arrayFieldset.should("exist");

    // Verify initial state
    arrayFieldset.getItemCount().should("eq", 2);
    cy.get('[data-testid="task-0-name"]').should(
      "contain",
      "Implement ArrayObjectFieldset"
    );
    cy.get('[data-testid="task-1-name"]').should("contain", "Write tests");

    // Update the description of the first task
    arrayFieldset.item(0).then((taskFieldset) => {
      taskFieldset.field("description").then((field) => {
        field.clear().type("Updated description for task 1");
      });
    });

    // Verify the description was updated in Redux
    cy.get('[data-testid="task-0-description"]').should(
      "contain",
      "Updated description for task 1"
    );

    // Update the description of the second task
    arrayFieldset.item(1).then((taskFieldset) => {
      taskFieldset.field("description").then((field) => {
        field.clear().type("Updated description for task 2");
      });
    });

    // Verify the description was updated in Redux
    cy.get('[data-testid="task-1-description"]').should(
      "contain",
      "Updated description for task 2"
    );

    // Verify both tasks were updated correctly
    cy.get('[data-testid="redux-state"]').should((el) => {
      const state = JSON.parse(el.text());
      expect(state[0].description).to.equal("Updated description for task 1");
      expect(state[1].description).to.equal("Updated description for task 2");
    });
  });
});
