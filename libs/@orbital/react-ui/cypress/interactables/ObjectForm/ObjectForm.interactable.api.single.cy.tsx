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
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  departmentId?: string;
  roleId?: string;
  projectIds?: string[];
  skillIds?: string[];
}

interface UserUpdatePayload {
  id: string;
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
        id: "user-1",
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

// Define additional schemas for references
const departmentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
  })
  .describe("Department");

const roleSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    level: z.number(),
  })
  .describe("Role")
  .displayName("title"); // Use the "title" field for display instead of the default "name"

const projectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    deadline: z.string(),
  })
  .describe("Project");

const skillSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
  })
  .describe("Skill");

// Define the User schema with references
const userSchema = z.object({
  id: z.string().optional(),
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
  { id: "dept-1", name: "Engineering", location: "Building A" },
  { id: "dept-2", name: "Marketing", location: "Building B" },
];

const roles = [
  { id: "role-1", title: "Developer", level: 3 },
  { id: "role-2", title: "Manager", level: 5 },
];

const projects = [
  { id: "project-1", name: "Website Redesign", deadline: "2023-12-31" },
  { id: "project-2", name: "Mobile App", deadline: "2024-06-30" },
  { id: "project-3", name: "API Integration", deadline: "2023-09-15" },
];

const skills = [
  { id: "skill-1", name: "JavaScript", level: 4 },
  { id: "skill-2", name: "React", level: 3 },
  { id: "skill-3", name: "Node.js", level: 5 },
];

// Create a bridge for the schema with dependencies
const userBridge = new ZodReferencesBridge({
  schema: userSchema,
  dependencies: {
    // The keys must match the schema names from the reference metadata
    Department: departments.map((dept) => ({ ...dept, _id: dept.id })),
    Role: roles.map((role) => ({ ...role, _id: role.id })),
    Project: projects.map((project) => ({ ...project, _id: project.id })),
    Skill: skills.map((skill) => ({ ...skill, _id: skill.id })),
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
  id: "user-1",
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
              id: "new-user-1",
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
              id: "new-user-1",
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
      console.log("Create mutation called with:", JSON.stringify(data));

      // Extract the actual data from the wrapper object
      const userData = data.createUserDto || data;

      // Create a promise that resolves after a short delay
      return new Cypress.Promise((resolve) => {
        setTimeout(() => {
          // Dispatch action to Redux store
          store.dispatch(
            userAdded({
              id: "new-user-1",
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

          console.log("Dispatched userAdded action");

          resolve({
            data: {
              id: "new-user-1",
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

    // Simpler approach to check for userAdded action
    cy.log("Checking if userAdded action was dispatched");

    // Log the Redux store state for debugging
    cy.window().then((win) => {
      const state = store.getState();
      cy.log("Redux store state:", JSON.stringify(state.users.entities));
    });

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

    // Use the standard objectForm interactable
    const form = objectForm({
      objectType: "User",
    });

    // Fill out the form using the interactable
    form.setFieldValue("name", "Error Test User");
    form.setFieldValue("email", "error@example.com");

    // Submit the form using the interactable
    form.submit();

    // Wait for any loading indicators to disappear
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForHidden(5000);

    // Verify console.error was called (this indicates the error was caught)
    cy.get("@consoleError").should("be.called");

    // Check for the error alert with the data-testid and verify it contains the error text
    cy.get('[data-testid="ObjectFormErrorAlert"]')
      .should("exist")
      .and("be.visible")
      .and("contain", "API Error: Failed to create");
  });
});
