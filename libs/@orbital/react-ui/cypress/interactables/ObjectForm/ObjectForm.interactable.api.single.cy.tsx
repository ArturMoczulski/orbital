import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import { Provider } from "react-redux";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { NotificationProvider } from "../../../../../../libs/@orbital/react-ui/src/components/NotificationProvider/NotificationProvider";
import { ObjectForm } from "../../../../../../libs/@orbital/react-ui/src/components/ObjectForm/ObjectForm";
import { objectForm } from "./ObjectForm.interactable";

// Define action types and interfaces
interface UserPayload {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface UserUpdatePayload {
  id: string;
  name?: string;
  email?: string;
  isActive?: boolean;
}

// Action creators
const userAdded = (payload: UserPayload) => ({
  type: "users/userAdded" as const,
  payload,
});

const userUpdated = (payload: UserUpdatePayload) => ({
  type: "users/userUpdated" as const,
  payload,
});

type UserAction = ReturnType<typeof userAdded> | ReturnType<typeof userUpdated>;

// Define the Redux slice for users
const initialState = {
  users: {
    entities: {
      "user-1": {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
      },
    },
    ids: ["user-1"],
  },
};

// Create a Redux store
const store = configureStore({
  reducer: {
    users: (state = initialState.users, action: UserAction | any) => {
      if (action.type === "RESET_STATE") {
        // Reset to initial state
        return initialState.users;
      }
      if (action.type === "users/userAdded") {
        const userAction = action as ReturnType<typeof userAdded>;
        return {
          ...state,
          entities: {
            ...state.entities,
            [userAction.payload.id]: userAction.payload,
          },
          ids: [...state.ids, userAction.payload.id],
        };
      }
      if (action.type === "users/userUpdated") {
        const userAction = action as ReturnType<typeof userUpdated>;
        return {
          ...state,
          entities: {
            ...state.entities,
            [userAction.payload.id]: {
              ...state.entities[userAction.payload.id],
              ...userAction.payload,
            },
          },
        };
      }
      return state;
    },
  },
  preloadedState: initialState,
});

// Define the User schema
const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  isActive: z.boolean().default(true),
});

// Create a bridge for the schema
const userBridge = new ZodBridge({
  schema: userSchema,
});

// Define the ObjectFormApiInterface
interface ObjectFormApiInterface {
  [key: string]: any;
  useUsersControllerCreateMutation?: () => [
    (data: any) => Promise<any>,
    { isLoading: boolean },
  ];
  useUsersControllerUpdateMutation?: () => [
    (data: any) => Promise<any>,
    { isLoading: boolean },
  ];
}

// Initial user data
const initialUser = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  isActive: true,
};

describe("ObjectForm API Integration Tests", () => {
  // Mock RTK Query API with mutation hooks
  const createMockApi = (
    options: { isLoading?: boolean; delay?: number } = {
      isLoading: false,
      delay: 1000,
    }
  ) => {
    // Create the mutation functions directly
    const createMutation = (data: any) => {
      // Extract the actual data from the wrapper object
      const userData = data.createUserDto || data;

      // Create a promise that resolves after the specified delay
      return new Cypress.Promise((resolve) => {
        const actualDelay = options.delay || 0;

        // Simulate a longer running API call
        setTimeout(() => {
          // Dispatch action to Redux store
          store.dispatch(
            userAdded({
              id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
            })
          );

          resolve({
            data: {
              id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
            },
          });
        }, actualDelay);
      });
    };

    const updateMutation = (data: any) => {
      // Extract the actual data from the wrapper object
      const userData = data.updateUserDto || data;

      // Create a promise that resolves after the specified delay
      return new Cypress.Promise((resolve) => {
        const actualDelay = options.delay || 0;

        setTimeout(() => {
          // Dispatch action to Redux store
          store.dispatch(
            userUpdated({
              id: data._id || "user-1",
              ...userData,
            })
          );
          resolve({ data: userData });
        }, actualDelay);
      });
    };

    // Create the mock API object
    const mockApi: ObjectFormApiInterface = {
      useUsersControllerCreateMutation: () => [
        createMutation as unknown as (data: any) => Promise<any>,
        { isLoading: options.isLoading ?? false },
      ],
      useUsersControllerUpdateMutation: () => [
        updateMutation as unknown as (data: any) => Promise<any>,
        { isLoading: options.isLoading ?? false },
      ],
    };

    return mockApi;
  };

  // Mock API that throws an error
  const createErrorApi = () => {
    // Create the mock API object with proper typing
    const errorApi: ObjectFormApiInterface = {
      useUsersControllerCreateMutation: () => {
        // Return a function that will be called by the component
        const createFn = (data: any) => {
          // Throw a synchronous error instead of returning a rejected promise
          // This ensures the component's try/catch will catch it
          throw new Error("API Error: Failed to create");
        };

        // Return the mutation hook format expected by the component
        return [createFn, { isLoading: false }];
      },
      useUsersControllerUpdateMutation: () => {
        // Return a function that will be called by the component
        const updateFn = (data: any) => {
          // Throw a synchronous error instead of returning a rejected promise
          // This ensures the component's try/catch will catch it
          throw new Error("API Error: Failed to update");
        };

        // Return the mutation hook format expected by the component
        return [updateFn, { isLoading: false }];
      },
    };

    return errorApi;
  };

  it("should use the create mutation when isNew is true and update Redux state", () => {
    // Create a spy for the onSuccess callback
    const onSuccessSpy = cy.spy().as("onSuccessSpy");

    // Reset the Redux store to initial state before the test
    store.dispatch({ type: "RESET_STATE" });

    // Use the original createMockApi function which creates real functions
    // that dispatch to the Redux store
    const mockApi = createMockApi();

    // Mount the component with NotificationProvider
    mount(
      <Provider store={store}>
        <NotificationProvider>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            isNew={true}
            api={mockApi}
            onSuccess={onSuccessSpy}
          />
        </NotificationProvider>
      </Provider>
    );

    const form = objectForm({ objectType: "User" });

    // Verify that the id field is not displayed when isNew is true
    cy.get('[data-field-name="id"]').should("not.exist");

    // Fill out the form using the interactable
    form.setFieldValue("name", "New User");
    form.setFieldValue("email", "new@example.com");

    // Submit the form using the interactable
    form.submit();

    // Wait for the form submission to complete
    // We'll use the success notification as an indicator
    cy.get(".notistack-MuiContent-success", {
      timeout: 5000,
    }).should("contain", "User created successfully");

    // Wait for notification to fully display
    cy.wait(500);

    // Verify the success callback was called
    cy.get("@onSuccessSpy").should("have.been.calledOnce");
  });

  it(
    "should use onAdd prop override when provided",
    { defaultCommandTimeout: 10000 },
    () => {
      // Create a spy for the onAdd callback that returns a promise
      const onAddSpy = cy
        .spy(() => {
          return Promise.resolve({
            id: "custom-user-1",
            name: "Custom Add User",
            email: "custom@example.com",
            isActive: true,
          });
        })
        .as("onAddSpy");

      // Reset the Redux store to initial state before the test
      store.dispatch({ type: "RESET_STATE" });

      // Create a mock API object
      const mockApi = createMockApi();

      // Create a spy for the onSuccess callback
      const onSuccessSpy = cy.spy().as("onSuccessSpy");

      // Mount the component with NotificationProvider
      mount(
        <Provider store={store}>
          <NotificationProvider>
            <ObjectForm
              schema={userBridge}
              objectType="User"
              isNew={true}
              api={mockApi}
              onAdd={onAddSpy}
              onSuccess={onSuccessSpy}
            />
          </NotificationProvider>
        </Provider>
      );

      const form = objectForm({ objectType: "User" });

      // Fill out the form using the interactable
      form.setFieldValue("name", "Custom Add User");
      form.setFieldValue("email", "custom@example.com");

      // Submit the form using the interactable
      form.submit();

      // Verify the onAdd callback was called
      cy.get("@onAddSpy").should("have.been.calledOnce");

      // Check that onAddSpy was called with an object containing these properties
      cy.get("@onAddSpy").should("have.been.calledWithMatch", {
        name: "Custom Add User",
        email: "custom@example.com",
        isActive: true,
      });

      // Wait for the form submission to complete
      cy.get(".notistack-MuiContent-success", {
        timeout: 5000,
      }).should("contain", "User created successfully");

      // Wait for notification to fully display
      cy.wait(500);

      // Verify the onSuccess callback was called
      cy.get("@onSuccessSpy").should("have.been.calledOnce");
    }
  );

  it(
    "should update existing object with onUpdate prop override",
    { defaultCommandTimeout: 10000 },
    () => {
      // Create a spy for the onUpdate callback
      const onUpdateSpy = cy.spy().as("onUpdateSpy");

      // Reset the Redux store to initial state before the test
      store.dispatch({ type: "RESET_STATE" });

      // Create a mock API object
      const mockApi = createMockApi();

      // Create a spy for the onSuccess callback
      const onSuccessSpy = cy.spy().as("onSuccessSpy");

      // Mount the component with NotificationProvider
      mount(
        <Provider store={store}>
          <NotificationProvider>
            <ObjectForm
              schema={userBridge}
              objectType="User"
              isNew={false}
              model={initialUser}
              api={mockApi}
              onUpdate={onUpdateSpy}
              onSuccess={onSuccessSpy}
            />
          </NotificationProvider>
        </Provider>
      );

      const form = objectForm({ objectType: "User" });

      // Update the form fields using the interactable
      form.setFieldValue("name", "Updated User");
      form.setFieldValue("email", "updated@example.com");

      // Submit the form using the interactable
      form.submit();

      // Verify the onUpdate callback was called
      cy.get("@onUpdateSpy").should("have.been.calledOnce");
      cy.get("@onUpdateSpy").should("have.been.calledWithMatch", {
        name: "Updated User",
        email: "updated@example.com",
        isActive: true,
      });

      // Wait for the form submission to complete
      cy.get(".notistack-MuiContent-success", {
        timeout: 5000,
      }).should("contain", "User updated successfully");

      // Wait for notification to fully display
      cy.wait(500);

      // Verify the onSuccess callback was called
      cy.get("@onSuccessSpy").should("have.been.calledOnce");
    }
  );

  it(
    "should update existing object with api object update mutation",
    { defaultCommandTimeout: 10000 },
    () => {
      // Create a spy for the onSuccess callback
      const onSuccessSpy = cy.spy().as("onSuccessSpy");

      // Reset the Redux store to initial state before the test
      store.dispatch({ type: "RESET_STATE" });

      // Use the original createMockApi function which creates real functions
      // that dispatch to the Redux store
      const mockApi = createMockApi();

      // Mount the component with NotificationProvider
      mount(
        <Provider store={store}>
          <NotificationProvider>
            <ObjectForm
              schema={userBridge}
              objectType="User"
              isNew={false}
              model={initialUser}
              api={mockApi}
              onSuccess={onSuccessSpy}
            />
          </NotificationProvider>
        </Provider>
      );

      const form = objectForm({ objectType: "User" });

      // Update the form fields using the interactable
      form.setFieldValue("name", "API Updated User");
      form.setFieldValue("email", "api-updated@example.com");

      // Submit the form using the interactable
      form.submit();

      // Wait for the form submission to complete
      cy.get(".notistack-MuiContent-success", {
        timeout: 5000,
      }).should("contain", "User updated successfully");

      // Wait for notification to fully display
      cy.wait(500);

      // Verify the onSuccess callback was called
      cy.get("@onSuccessSpy").should("have.been.calledOnce");
    }
  );

  it("should display loading indicator while api functions are running", () => {
    // Reset the Redux store to initial state before the test
    store.dispatch({ type: "RESET_STATE" });

    // Create a mock API with a longer delay (5s) to ensure we can see the loading state
    const mockApi = createMockApi({ isLoading: false, delay: 500 });

    // Mount the component with a unique test ID
    cy.mount(
      <Provider store={store}>
        <NotificationProvider>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            isNew={true}
            api={mockApi}
          />
        </NotificationProvider>
      </Provider>
    );

    // For forms with custom data-testid, we need to use the parent element approach
    const form = objectForm({
      objectType: "User",
    });

    // Fill out the form using the interactable
    form.setFieldValue("name", "Loading Test User");
    form.setFieldValue("email", "loading@example.com");

    // Submit the form using the interactable
    form.submit();

    // Check for the loading indicator
    cy.get('[data-testid="ObjectFormLoadingIndicator"]').should("exist");
    cy.get('[data-testid="ObjectFormCircularProgress"]').should("exist");
    cy.get('[data-testid="ObjectFormLoadingIndicator"]').should("be.visible");

    // Wait for the form submission to complete
    cy.get(".notistack-MuiContent-success", { timeout: 10000 }).should(
      "contain",
      "User created successfully"
    );

    // Wait for notification to fully display
    cy.wait(500);

    // Check that the loading indicator is no longer visible (display: none)
    cy.get('[data-testid="ObjectFormLoadingIndicator"]')
      .should("exist") // It should still exist in the DOM
      .should("have.css", "display", "none"); // But should be hidden
  });

  it("should display api errors in the error component", () => {
    // Reset the Redux store to initial state before the test
    store.dispatch({ type: "RESET_STATE" });

    // Add a spy on console.error to see if errors are being caught
    cy.window().then((win) => {
      cy.spy(win.console, "error").as("consoleError");
    });

    // Use the error API that throws an error
    const errorApi = createErrorApi();

    // Mount the component with NotificationProvider
    cy.mount(
      <Provider store={store}>
        <NotificationProvider>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            isNew={true}
            api={errorApi}
          />
        </NotificationProvider>
      </Provider>
    );

    // Use the standard objectForm interactable
    const form = objectForm({
      objectType: "User",
    });

    // Fill out the form using the interactable
    form.setFieldValue("name", "Error Test User");
    form.setFieldValue("email", "error@example.com");

    // Submit the form using the interactable
    form.submit();

    // Wait for the error to be processed
    cy.wait(1000);

    // Verify console.error was called (this indicates the error was caught)
    cy.get("@consoleError").should("be.called");

    // Check for the error alert with the data-testid and verify it contains the error text
    cy.get('[data-testid="ObjectFormErrorAlert"]')
      .should("exist")
      .and("be.visible")
      .and("contain", "API Error: Failed to create");
  });
});
