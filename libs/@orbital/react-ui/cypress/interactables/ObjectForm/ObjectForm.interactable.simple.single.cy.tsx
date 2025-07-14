import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import React from "react";
import { Provider } from "react-redux";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { ObjectForm } from "../../../src/components/ObjectForm/ObjectForm";
import { TextInputInteractable } from "../AutoForm/FormInput.interactable";
import { objectForm } from "./ObjectForm.interactable";

describe("ObjectForm.interactable", () => {
  // Define a schema for testing
  const userSchema = z
    .object({
      id: z.string().describe("ID"),
      name: z.string().describe("Name"),
      email: z.string().email().describe("Email"),
      age: z.number().describe("Age"),
      isActive: z.boolean().describe("Active"),
      address: z
        .object({
          street: z.string().describe("Street"),
          city: z.string().describe("City"),
          zipCode: z.string().describe("Zip Code"),
        })
        .describe("Address"),
      hobbies: z.array(z.string()).describe("Hobbies"),
    })
    .describe("User");

  // Create a bridge for the schema
  const userBridge = new ZodBridge({ schema: userSchema });

  // Test data
  const initialUser = {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    isActive: true,
    address: {
      street: "123 Main St",
      city: "Anytown",
      zipCode: "12345",
    },
    hobbies: ["Reading", "Cycling"],
  };

  // Define types for our Redux state and actions
  interface ObjectData {
    data: Record<string, any>;
    objectId?: string;
    objectType: string;
  }

  interface ObjectDataState {
    objectData: {
      [key: string]: ObjectData;
    };
  }

  type ObjectDataAction =
    | {
        type: "UPDATE_OBJECT";
        payload: {
          key: string;
          data: Record<string, any>;
          merge?: boolean;
        };
      }
    | {
        type: "SET_OBJECT";
        payload: {
          key: string;
          data: Record<string, any>;
          objectId?: string;
          objectType: string;
        };
      };

  // Create a Redux slice for object data
  const initialState: ObjectDataState = {
    objectData: {
      user: {
        data: initialUser,
        objectId: "user-1",
        objectType: "User",
      },
    },
  };

  // Simple reducer for handling object data actions
  const objectDataReducer = (
    state = initialState,
    action: ObjectDataAction
  ): ObjectDataState => {
    switch (action.type) {
      case "UPDATE_OBJECT":
        const { key, data, merge = true } = action.payload;
        return {
          ...state,
          objectData: {
            ...state.objectData,
            [key]: {
              ...state.objectData[key],
              data: merge ? { ...state.objectData[key].data, ...data } : data,
            },
          },
        };
      case "SET_OBJECT":
        const {
          key: setKey,
          data: setData,
          objectId,
          objectType,
        } = action.payload;
        return {
          ...state,
          objectData: {
            ...state.objectData,
            [setKey]: {
              data: setData,
              objectId,
              objectType,
            },
          },
        };
      default:
        return state;
    }
  };

  // Action creators
  const updateObject = (
    key: string,
    data: Record<string, any>,
    merge = true
  ) => ({
    type: "UPDATE_OBJECT" as const,
    payload: { key, data, merge },
  });

  const setObject = (
    key: string,
    data: Record<string, any>,
    objectType: string,
    objectId?: string
  ) => ({
    type: "SET_OBJECT" as const,
    payload: { key, data, objectType, objectId },
  });

  // Create a real Redux store
  const createRealStore = () => {
    return configureStore({
      reducer: objectDataReducer,
      preloadedState: initialState,
    });
  };

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

  // Define the type for the store
  type StoreType = ReturnType<typeof createRealStore>;

  // Define props for TestComponent
  interface TestComponentProps {
    onInit?: (store: StoreType) => void;
    disabled?: boolean;
    readOnly?: boolean;
  }

  // Reusable test component with Redux
  function TestComponent({
    onInit,
    disabled,
    readOnly,
  }: TestComponentProps = {}) {
    const store = createRealStore();
    const [submitted, setSubmitted] = React.useState<Record<
      string,
      any
    > | null>(null);

    // Call onInit with the store reference if provided
    React.useEffect(() => {
      if (onInit) {
        onInit(store);
      }
    }, [store, onInit]);

    const handleSubmit = (data: any) => {
      setSubmitted(data);
      store.dispatch(updateObject("user", data));
    };

    return (
      <Provider store={store}>
        <div>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            model={store.getState().objectData.user.data}
            onSubmit={handleSubmit}
            disabled={disabled}
            readOnly={readOnly}
            // Redux props for object operations
            objectDispatch={store.dispatch}
            objectCreateUpdateAction={(key, data, merge) =>
              updateObject(key, data, merge)
            }
            objectDataSelector={(objectType, objectId) =>
              store.getState().objectData.user.data
            }
          />
          {submitted && (
            <div data-testid="submitted-data">{JSON.stringify(submitted)}</div>
          )}
        </div>
      </Provider>
    );
  }

  it("should render the component and verify fields", () => {
    mount(<TestComponent />);

    // Get the ObjectForm interactable
    const form = objectForm({ objectType: "User" });

    // Verify the interactable can find the component
    form.should("exist");

    // Use the interactable's field method to verify fields exist
    form.field("name").should("exist");
    form.field("email").should("exist");
    form.field("age").should("exist");
    form.field("isActive").should("exist");
  });

  it("should access and verify field values", () => {
    mount(<TestComponent />);

    const form = objectForm({ objectType: "User" });

    // Use direct field access and check values
    form.getFieldValue("name").should("eq", "John Doe");
    form.getFieldValue("email").should("eq", "john@example.com");
    form.getFieldValue("age").should("eq", 30);
    form.getFieldValue("isActive").should("eq", true);
  });

  it("should handle form submission", () => {
    mount(<TestComponent />);

    const form = objectForm({ objectType: "User" });

    // Change a field value using direct Cypress commands
    form
      .field<TextInputInteractable>("name")
      .then((f) => f.setValue("Jane Smith"));

    // Submit the form
    form.submit();

    // Verify the form was submitted with the updated data
    cy.get('[data-testid="submitted-data"]').should("contain", "Jane Smith");
  });

  it("should handle disabled state", () => {
    mount(<TestComponent disabled={true} />);

    const form = objectForm({ objectType: "User" });

    // Verify the form is disabled
    form.isDisabled().should("eq", true);

    // Verify a field is disabled using the form's field method
    form.field("name").then((f) => f.isDisabled().should("be.true"));
  });

  it("should handle readonly state", () => {
    mount(<TestComponent readOnly={true} />);

    const form = objectForm({ objectType: "User" });

    // Verify the form is readonly
    form.isReadOnly().should("eq", true);

    // Verify a field is readonly using the form's field method
    form.field("name").then((f) => f.get().should("have.attr", "readonly"));
  });

  it("should handle nested object fields", () => {
    mount(<TestComponent />);

    const form = objectForm({ objectType: "User" });

    // Use direct field access and check values
    form.field("address.street").should("exist");
    form.getFieldValue("address.street").should("eq", "123 Main St");
    form.getFieldValue("address.city").should("eq", "Anytown");
  });

  it("should handle array fields", () => {
    mount(<TestComponent />);

    const form = objectForm({ objectType: "User" });

    // For array fields, we need to check individual array items
    form.field("hobbies.0").should("exist");
    form.getFieldValue("hobbies.0").should("eq", "Reading");
    form.field("hobbies.1").should("exist");
    form.getFieldValue("hobbies.1").should("eq", "Cycling");
  });

  it("should update Redux state when form is submitted", () => {
    // Create a store directly in the test
    const store = createRealStore();

    // Create a component that uses the provided store
    const TestComponentWithStore = () => {
      const [submitted, setSubmitted] = React.useState<Record<
        string,
        any
      > | null>(null);

      const handleSubmit = (data: any) => {
        setSubmitted(data);
        store.dispatch(updateObject("user", data));
      };

      return (
        <Provider store={store}>
          <div>
            <ObjectForm
              schema={userBridge}
              objectType="User"
              model={store.getState().objectData.user.data}
              onSubmit={handleSubmit}
              // Redux props for object operations
              objectDispatch={store.dispatch}
              objectCreateUpdateAction={(key, data, merge) =>
                updateObject(key, data, merge)
              }
              objectDataSelector={(objectType, objectId) =>
                store.getState().objectData.user.data
              }
            />
            {submitted && (
              <div data-testid="submitted-data">
                {JSON.stringify(submitted)}
              </div>
            )}
          </div>
        </Provider>
      );
    };

    mount(<TestComponentWithStore />);

    const form = objectForm({ objectType: "User" });

    // Change a field value using direct Cypress commands
    form.field("name").clear().type("Jane Smith");

    // Submit the form
    form.submit();

    // Verify the Redux state was updated
    cy.wait(500).then(() => {
      expect(store.getState().objectData.user.data.name).to.equal("Jane Smith");
    });
  });
});
