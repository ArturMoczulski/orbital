import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import { Provider } from "react-redux";
import { z } from "zod";
import { NotificationProvider } from "../../../../../../libs/@orbital/react-ui/src/components/NotificationProvider/NotificationProvider";
import { ObjectForm } from "../../../../../../libs/@orbital/react-ui/src/components/ObjectForm/ObjectForm";
import { ZodReferencesBridge } from "../../../../../../libs/@orbital/react-ui/src/components/ObjectForm/ZodReferencesBridge";
import { circularProgress } from "../MaterialUI/CircularProgress.interactable";
import { snackbar } from "../MaterialUI/Snackbar.interactable";
import { objectForm } from "./ObjectForm.interactable";

// Define action types and interfaces
interface UserPayload {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  departmentId?: string;
  roleId?: string;
  projectIds?: string[];
  skillIds?: string[];
}

interface UserUpdatePayload {
  _id: string;
  name?: string;
  email?: string;
  isActive?: boolean;
  departmentId?: string;
  roleId?: string;
  projectIds?: string[];
  skillIds?: string[];
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
        _id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        departmentId: "dept-1",
        roleId: "role-1",
        projectIds: ["project-1", "project-2"],
        skillIds: ["skill-1", "skill-2"],
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
            [userAction.payload._id]: userAction.payload,
          },
          ids: [...state.ids, userAction.payload._id],
        };
      }
      if (action.type === "users/userUpdated") {
        const userAction = action as ReturnType<typeof userUpdated>;

        const updatedState = {
          ...state,
          entities: {
            ...state.entities,
            [userAction.payload._id]: {
              ...state.entities[userAction.payload._id],
              ...userAction.payload,
            },
          },
        };

        return updatedState;
      }
      return state;
    },
  },
  preloadedState: initialState,
});

// Define additional schemas for references
const departmentSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    location: z.string(),
  })
  .describe("Department");

const roleSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    level: z.number(),
  })
  .describe("Role")
  .displayName("title"); // Use the "title" field for display instead of the default "name"

const projectSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    deadline: z.string(),
  })
  .describe("Project");

const skillSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    level: z.number(),
  })
  .describe("Skill");

// Define the User schema with references
const userSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  isActive: z.boolean().default(true),
  // BelongsTo references
  departmentId: z.string().reference({
    schema: departmentSchema,
    name: "Department",
    type: RelationshipType.BELONGS_TO,
  }),
  roleId: z.string().reference({
    schema: roleSchema,
    name: "Role",
    type: RelationshipType.BELONGS_TO,
  }),
  // HasMany references
  projectIds: z.array(z.string()).reference({
    schema: projectSchema,
    name: "Project",
    type: RelationshipType.HAS_MANY,
  }),
  skillIds: z.array(z.string()).reference({
    schema: skillSchema,
    name: "Skill",
    type: RelationshipType.HAS_MANY,
  }),
});

// Sample data for references
const departments = [
  { _id: "dept-1", name: "Engineering", location: "Building A" },
  { _id: "dept-2", name: "Marketing", location: "Building B" },
];

const roles = [
  { _id: "role-1", title: "Developer", level: 3 },
  { _id: "role-2", title: "Manager", level: 5 },
];

const projects = [
  { _id: "project-1", name: "Website Redesign", deadline: "2023-12-31" },
  { _id: "project-2", name: "Mobile App", deadline: "2024-06-30" },
  { _id: "project-3", name: "API Integration", deadline: "2023-09-15" },
];

const skills = [
  { _id: "skill-1", name: "JavaScript", level: 4 },
  { _id: "skill-2", name: "React", level: 3 },
  { _id: "skill-3", name: "Node.js", level: 5 },
];

// Create a bridge for the schema with dependencies
const userBridge = new ZodReferencesBridge({
  schema: userSchema,
  dependencies: {
    // The keys must match the schema names from the reference metadata
    Department: departments,
    Role: roles,
    Project: projects,
    Skill: skills,
  },
});

// Add Cypress namespace to window for detection in ObjectForm
if (typeof window !== "undefined") {
  (window as any).Cypress = Cypress;
}

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
  _id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  isActive: true,
  departmentId: "dept-1",
  roleId: "role-1",
  projectIds: ["project-1", "project-2"],
  skillIds: ["skill-1", "skill-2"],
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
              _id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
              departmentId: userData.departmentId || "dept-1",
              roleId: userData.roleId || "role-1",
              projectIds: userData.projectIds || ["project-1", "project-2"],
              skillIds: userData.skillIds || ["skill-1", "skill-2"],
            })
          );

          resolve({
            data: {
              _id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
              departmentId: userData.departmentId || "dept-1",
              roleId: userData.roleId || "role-1",
              projectIds: userData.projectIds || ["project-1", "project-2"],
              skillIds: userData.skillIds || ["skill-1", "skill-2"],
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
              _id: data._id || "user-1",
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

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Use the original createMockApi function which creates real functions
    // that dispatch to the Redux store
    const mockApi = createMockApi({
      delay: 100, // Reduce delay to make test faster
    });

    // Create a spy for the create function
    const createMutationSpy = cy.spy().as("createMutationSpy");

    // Create a custom mock API with a spy
    const createFn = (data: any) => {
      // Extract the actual data from the wrapper object
      const userData = data.createUserDto || data;

      // Create a promise that resolves after a short delay
      return new Cypress.Promise((resolve) => {
        setTimeout(() => {
          // Dispatch action to Redux store
          store.dispatch(
            userAdded({
              _id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
              departmentId: userData.departmentId || "dept-1",
              roleId: userData.roleId || "role-1",
              projectIds: userData.projectIds || ["project-1", "project-2"],
              skillIds: userData.skillIds || ["skill-1", "skill-2"],
            })
          );

          resolve({
            data: {
              _id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
              departmentId: userData.departmentId || "dept-1",
              roleId: userData.roleId || "role-1",
              projectIds: userData.projectIds || ["project-1", "project-2"],
              skillIds: userData.skillIds || ["skill-1", "skill-2"],
            },
          });
        }, 100);
      });
    };

    // Override the mock API with our spy that wraps the original function
    mockApi.useUsersControllerCreateMutation = () => [
      (data: any) => {
        // Call the spy first
        createMutationSpy(data);
        // Then call the original function
        return createFn(data);
      },
      { isLoading: false },
    ];

    // Mount the component with NotificationProvider and ObjectDataProvider
    mount(
      <Provider store={store}>
        <NotificationProvider>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            isNew={true}
            api={mockApi}
            onSuccess={onSuccessSpy}
            successMessage="User created successfully"
            model={{
              name: "",
              email: "",
              isActive: true,
              departmentId: "dept-1",
              roleId: "role-1",
              projectIds: ["project-1", "project-2"],
              skillIds: ["skill-1", "skill-2"],
            }}
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
    // Wait for the loading indicator to appear and then disappear
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(10000);

    // Check if the createMutationSpy was called
    cy.get("@createMutationSpy").should("have.been.calledOnce");

    // Check if the dispatch spy was called
    cy.get("@dispatchSpy").should("have.been.called");

    // Check if the success notification is displayed using the snackbar interactable
    snackbar({ variant: "success" }).waitForMessage(
      "User created successfully",
      5000
    );

    // Check if the Redux store was updated with the new user

    // Check if the Redux store was updated with the new user
    cy.window().then((win) => {
      const state = store.getState();
      expect(state.users.entities).to.have.property("new-user-1");
      expect(state.users.entities["new-user-1"].name).to.equal("New User");
      expect(state.users.entities["new-user-1"].email).to.equal(
        "new@example.com"
      );
    });

    // Verify the success callback was called
    cy.get("@onSuccessSpy").should("have.been.calledOnce");

    // Check if the Redux store was updated with the new user
    cy.window().then((win) => {
      const state = store.getState();
      expect(state.users.entities).to.have.property("new-user-1");
      expect(state.users.entities["new-user-1"].name).to.equal("New User");
      expect(state.users.entities["new-user-1"].email).to.equal(
        "new@example.com"
      );
    });
  });

  it(
    "should use onAdd prop override when provided",
    { defaultCommandTimeout: 10000 },
    () => {
      // Create a spy for the onAdd callback that returns a promise with a delay
      const onAddSpy = cy
        .spy(() => {
          // Add a delay to ensure the loading indicator has time to be rendered
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                id: "custom-user-1",
                name: "Custom Add User",
                email: "custom@example.com",
                isActive: true,
              });
            }, 500); // 500ms delay
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
              model={{
                name: "",
                email: "",
                isActive: true,
                departmentId: "dept-1",
                roleId: "role-1",
                projectIds: ["project-1", "project-2"],
                skillIds: ["skill-1", "skill-2"],
              }}
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
      // First wait for loading indicator to complete its cycle
      circularProgress({
        dataTestId: "ObjectFormLoadingIndicator",
      }).waitForCompletion(5000);

      // Then check for the success notification
      snackbar({ variant: "success" }).waitForMessage(
        "User created successfully",
        5000
      );

      // Verify the onSuccess callback was called
      cy.get("@onSuccessSpy").should("have.been.calledOnce");
    }
  );

  it(
    "should update existing object with onUpdate prop override",
    { defaultCommandTimeout: 10000 },
    () => {
      // Create a spy for the onUpdate callback that returns a promise with a delay
      const onUpdateSpy = cy
        .spy(() => {
          // Add a delay to ensure the loading indicator has time to be rendered
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                id: "user-1",
                name: "Updated User",
                email: "updated@example.com",
                isActive: true,
              });
            }, 500); // 500ms delay
          });
        })
        .as("onUpdateSpy");

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
      // First wait for loading indicator to complete its cycle
      circularProgress({
        dataTestId: "ObjectFormLoadingIndicator",
      }).waitForCompletion(5000);

      // Then check for the success notification
      snackbar({ variant: "success" }).waitForMessage(
        "User updated successfully",
        5000
      );

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
      // First wait for loading indicator to complete its cycle
      circularProgress({
        dataTestId: "ObjectFormLoadingIndicator",
      }).waitForCompletion(5000);

      // Then check for the success notification
      snackbar({ variant: "success" }).waitForMessage(
        "User updated successfully",
        5000
      );

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
            model={{
              name: "",
              email: "",
              isActive: true,
              departmentId: "dept-1",
              roleId: "role-1",
              projectIds: ["project-1", "project-2"],
              skillIds: ["skill-1", "skill-2"],
            }}
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
    circularProgress({ dataTestId: "ObjectFormLoadingIndicator" }).isVisible();
    circularProgress({ dataTestId: "ObjectFormCircularProgress" }).isVisible();

    // Wait for the loading indicator to complete its cycle
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(10000);

    // Check for the success notification
    snackbar({ variant: "success" }).waitForMessage(
      "User created successfully",
      10000
    );

    // Verify the loading indicator is hidden after completion
    circularProgress({ dataTestId: "ObjectFormLoadingIndicator" }).isHidden();
  });

  it.only("should verify all fields including reference IDs are correctly passed to create API", () => {
    // Create a spy for the onSuccess callback
    const onSuccessSpy = cy.spy().as("onSuccessSpy");

    // Reset the Redux store to initial state before the test
    store.dispatch({ type: "RESET_STATE" });

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Use the original createMockApi function which creates real functions
    // that dispatch to the Redux store
    const mockApi = createMockApi({
      delay: 100, // Reduce delay to make test faster
    });

    // Create a spy for the create function
    const createMutationSpy = cy.spy().as("createMutationSpy");

    // Create a custom mock API with a spy
    const createFn = (data: any) => {
      // Extract the actual data from the wrapper object
      const userData = data.createUserDto || data;

      // Create a promise that resolves after a short delay
      return new Cypress.Promise((resolve) => {
        setTimeout(() => {
          // Dispatch action to Redux store
          store.dispatch(
            userAdded({
              _id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
              departmentId: userData.departmentId || "dept-1",
              roleId: userData.roleId || "role-1",
              projectIds: userData.projectIds || ["project-1", "project-2"],
              skillIds: userData.skillIds || ["skill-1", "skill-2"],
            })
          );

          resolve({
            data: {
              _id: "new-user-1",
              name: userData.name || "",
              email: userData.email || "",
              isActive:
                userData.isActive !== undefined ? userData.isActive : true,
              departmentId: userData.departmentId || "dept-1",
              roleId: userData.roleId || "role-1",
              projectIds: userData.projectIds || ["project-1", "project-2"],
              skillIds: userData.skillIds || ["skill-1", "skill-2"],
            },
          });
        }, 100);
      });
    };

    // Override the mock API with our spy that wraps the original function
    mockApi.useUsersControllerCreateMutation = () => [
      (data: any) => {
        // Call the spy first
        createMutationSpy(data);
        // Then call the original function
        return createFn(data);
      },
      { isLoading: false },
    ];

    // Define the initial model with reference fields
    const initialModel = {
      name: "Test User",
      email: "test@example.com",
      isActive: true,
      departmentId: "dept-2",
      roleId: "role-2",
      projectIds: ["project-1", "project-3"],
      skillIds: ["skill-2", "skill-3"],
    };

    // Create an object data selector function for Redux integration
    const objectDataSelector = (objectType: string, objectId?: string) => {
      return initialModel;
    };

    // Create an action creator for updating object data in Redux
    const objectCreateUpdateAction = (
      key: string,
      data: Record<string, any>,
      merge = true
    ) => {
      // For testing purposes, we'll just return a simple action
      // In a real app, this would create a proper Redux action
      return {
        type: "UPDATE_OBJECT_DATA",
        payload: {
          key,
          data,
          merge,
        },
      };
    };

    // Mount the component with NotificationProvider and proper Redux integration
    mount(
      <Provider store={store}>
        <NotificationProvider>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            isNew={true}
            api={mockApi}
            onSuccess={onSuccessSpy}
            successMessage="User created successfully"
            model={initialModel}
            // Add Redux integration props
            objectDispatch={store.dispatch}
            objectCreateUpdateAction={objectCreateUpdateAction}
            objectDataSelector={objectDataSelector}
          />
        </NotificationProvider>
      </Provider>
    );

    const form = objectForm({ objectType: "User" });

    // Modify the reference fields to test that changes are properly tracked
    // Update departmentId (BelongsTo field)
    store.dispatch(
      userUpdated({
        _id: "user-1",
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-1", "project-3"],
        skillIds: ["skill-2", "skill-3"],
      })
    );

    // Submit the form
    form.submit();

    // Wait for the loading indicator to complete
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(5000);

    // Check if the success notification is displayed
    snackbar({ variant: "success" }).waitForMessage(
      "User created successfully",
      5000
    );

    // Verify the createMutation was called with the correct data
    cy.get("@createMutationSpy").should("have.been.calledOnce");
    cy.get("@createMutationSpy").should("have.been.calledWithMatch", {
      createUserDto: {
        name: "Test User",
        email: "test@example.com",
        isActive: true,
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-1", "project-3"],
        skillIds: ["skill-2", "skill-3"],
      },
    });

    // We already verified the createMutation call above, no need for a duplicate assertion

    // Wait for the Redux store to be updated
    cy.wait(300).then(() => {
      // Verify the Redux store was updated correctly
      const state = store.getState();

      // Check if new-user-1 exists in the store
      expect(state.users.entities).to.have.property("new-user-1");

      // Now verify all the properties
      expect(state.users.entities["new-user-1"].name).to.equal("Test User");
      expect(state.users.entities["new-user-1"].email).to.equal(
        "test@example.com"
      );
      expect(state.users.entities["new-user-1"].departmentId).to.equal(
        "dept-2"
      );
      expect(state.users.entities["new-user-1"].roleId).to.equal("role-2");
      expect(state.users.entities["new-user-1"].projectIds).to.deep.equal([
        "project-1",
        "project-3",
      ]);
      expect(state.users.entities["new-user-1"].skillIds).to.deep.equal([
        "skill-2",
        "skill-3",
      ]);
    });
  });

  it("should allow editing all fields including reference fields in isNew=false mode", () => {
    // Create a spy for the update mutation
    const updateMutationSpy = cy.spy().as("updateMutationSpy");

    // Reset the Redux store to initial state before the test
    store.dispatch({ type: "RESET_STATE" });

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Create a mock API with a spy for the update mutation
    const mockApi = createMockApi({ delay: 100 });

    // Override the update mutation with our spy
    mockApi.useUsersControllerUpdateMutation = () => [
      (data: any) => {
        // Call the spy first
        updateMutationSpy(data);

        // Extract the actual data from the wrapper object
        const userData = data.updateUserDto || data;

        // Create a promise that resolves after a short delay
        return new Cypress.Promise((resolve) => {
          setTimeout(() => {
            // Dispatch action to Redux store
            const action = userUpdated({
              _id: data._id || "user-1",
              ...userData,
            });
            store.dispatch(action);

            resolve({ data: userData });
          }, 100);
        });
      },
      { isLoading: false },
    ];

    // Create an object data selector function for Redux integration
    const objectDataSelector = (objectType: string, objectId?: string) => {
      const state = store.getState();
      return state.users.entities["user-1"];
    };

    // Create an action creator for updating object data in Redux
    const objectCreateUpdateAction = (
      key: string,
      data: Record<string, any>,
      merge = true
    ) => {
      if (key === "main") {
        return userUpdated({
          _id: "user-1",
          ...data,
        });
      }
      return { type: "UNKNOWN_ACTION" };
    };

    // Mount the component with NotificationProvider and proper Redux integration
    mount(
      <Provider store={store}>
        <NotificationProvider>
          <ObjectForm
            schema={userBridge}
            objectType="User"
            isNew={false}
            model={initialUser}
            api={mockApi}
            successMessage="User updated successfully"
            // Add Redux integration props with correct prop names
            objectDispatch={store.dispatch}
            objectCreateUpdateAction={objectCreateUpdateAction}
            objectDataSelector={objectDataSelector}
          />
        </NotificationProvider>
      </Provider>
    );

    // Get the form interactable
    const form = objectForm({ objectType: "User" });

    // Update basic fields
    form.setFieldValue("name", "Updated User");
    form.setFieldValue("email", "updated@example.com");
    cy.wait(300);

    // Update reference fields through Redux
    // This simulates user interaction with the reference fields
    store.dispatch(
      userUpdated({
        _id: "user-1",
        name: "Updated User",
        email: "updated@example.com",
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-2", "project-3"],
        skillIds: ["skill-1", "skill-3"],
      })
    );

    // Verify that the values have been updated in the Redux store
    const stateAfterUpdate = store.getState();

    // Assert that the values have been updated in the Redux store
    expect(stateAfterUpdate.users.entities["user-1"].departmentId).to.equal(
      "dept-2"
    );
    expect(stateAfterUpdate.users.entities["user-1"].roleId).to.equal("role-2");
    expect(stateAfterUpdate.users.entities["user-1"].projectIds).to.deep.equal([
      "project-2",
      "project-3",
    ]);
    expect(stateAfterUpdate.users.entities["user-1"].skillIds).to.deep.equal([
      "skill-1",
      "skill-3",
    ]);

    // Add a wait to ensure all state updates are complete
    cy.wait(500);

    // Submit the form
    form.submit();

    // Wait for the loading indicator to complete
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(5000);

    // Check for the success notification
    snackbar({ variant: "success" }).waitForMessage(
      "User updated successfully",
      5000
    );

    // Verify the update mutation was called with all the correct field values
    cy.get("@updateMutationSpy").should("have.been.calledOnce");
    cy.get("@updateMutationSpy").should("have.been.calledWithMatch", {
      _id: "user-1",
      updateUserDto: {
        _id: "user-1",
        name: "Updated User",
        email: "updated@example.com",
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-2", "project-3"],
        skillIds: ["skill-1", "skill-3"],
      },
    });

    // Verify the Redux store was updated correctly
    const state = store.getState();

    expect(state.users.entities["user-1"].name).to.equal("Updated User");
    expect(state.users.entities["user-1"].email).to.equal(
      "updated@example.com"
    );
    expect(state.users.entities["user-1"].departmentId).to.equal("dept-2");
    expect(state.users.entities["user-1"].roleId).to.equal("role-2");
    expect(state.users.entities["user-1"].projectIds).to.deep.equal([
      "project-2",
      "project-3",
    ]);
    expect(state.users.entities["user-1"].skillIds).to.deep.equal([
      "skill-1",
      "skill-3",
    ]);
  });
});
