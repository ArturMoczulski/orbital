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
export interface UserPayload {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  departmentId?: string;
  roleId?: string;
  projectIds?: string[];
  skillIds?: string[];
}

export interface UserUpdatePayload {
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
export const userAdded = (payload: UserPayload) => ({
  type: "users/userAdded" as const,
  payload,
});

export const userUpdated = (payload: UserUpdatePayload) => ({
  type: "users/userUpdated" as const,
  payload,
});

export type UserAction =
  | ReturnType<typeof userAdded>
  | ReturnType<typeof userUpdated>;

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
export const store = configureStore({
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
export const departmentSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    location: z.string(),
  })
  .describe("Department");

export const roleSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    level: z.number(),
  })
  .describe("Role")
  .displayName("title"); // Use the "title" field for display instead of the default "name"

export const projectSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    deadline: z.string(),
  })
  .describe("Project");

export const skillSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    level: z.number(),
  })
  .describe("Skill");

// Define the User schema with references
export const userSchema = z.object({
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
export const departments = [
  { _id: "dept-1", name: "Engineering", location: "Building A" },
  { _id: "dept-2", name: "Marketing", location: "Building B" },
];

export const roles = [
  { _id: "role-1", title: "Developer", level: 3 },
  { _id: "role-2", title: "Manager", level: 5 },
];

export const projects = [
  { _id: "project-1", name: "Website Redesign", deadline: "2023-12-31" },
  { _id: "project-2", name: "Mobile App", deadline: "2024-06-30" },
  { _id: "project-3", name: "API Integration", deadline: "2023-09-15" },
];

export const skills = [
  { _id: "skill-1", name: "JavaScript", level: 4 },
  { _id: "skill-2", name: "React", level: 3 },
  { _id: "skill-3", name: "Node.js", level: 5 },
];

// Create a bridge for the schema with dependencies
export const userBridge = new ZodReferencesBridge({
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
export interface ObjectFormApiInterface {
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
export const initialUser = {
  _id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  isActive: true,
  departmentId: "dept-1",
  roleId: "role-1",
  projectIds: ["project-1", "project-2"],
  skillIds: ["skill-1", "skill-2"],
};

// Default empty model
export const emptyModel = {
  name: "",
  email: "",
  isActive: true,
  departmentId: "dept-1",
  roleId: "role-1",
  projectIds: ["project-1", "project-2"],
  skillIds: ["skill-1", "skill-2"],
};

/**
 * Create a mock API with customizable options
 */
export const createMockApi = (
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

/**
 * Create a mock API that throws errors
 */
export const createErrorApi = () => {
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

/**
 * Create a mock API with a spy for the create mutation
 */
export const createMockApiWithCreateSpy = (
  options = { delay: 300 }, // Increased default delay
  modelStateRef?: any
) => {
  const mockApi = createMockApi(options);
  const createMutationSpy = cy.spy().as("createMutationSpy");

  // Create a custom mock API with a spy
  const createFn = (data: any) => {
    // Extract the actual data from the wrapper object
    const userData = data.createUserDto || data;

    // Create a promise that resolves after a short delay
    return new Cypress.Promise((resolve) => {
      setTimeout(() => {
        // Use model state if provided, otherwise use form data
        const finalData = modelStateRef
          ? {
              ...userData,
              departmentId: modelStateRef.current.departmentId,
              roleId: modelStateRef.current.roleId,
              projectIds: modelStateRef.current.projectIds,
              skillIds: modelStateRef.current.skillIds,
            }
          : userData;

        // Log the data being used (using console.log instead of cy.log to avoid Promise issues)
        console.log(`Using data for API call:`, finalData);

        // Dispatch action to Redux store
        store.dispatch(
          userAdded({
            _id: "new-user-1",
            name: finalData.name || "",
            email: finalData.email || "",
            isActive:
              finalData.isActive !== undefined ? finalData.isActive : true,
            departmentId: finalData.departmentId || "dept-1",
            roleId: finalData.roleId || "role-1",
            projectIds: finalData.projectIds || ["project-1", "project-2"],
            skillIds: finalData.skillIds || ["skill-1", "skill-2"],
          })
        );

        resolve({
          data: {
            _id: "new-user-1",
            name: finalData.name || "",
            email: finalData.email || "",
            isActive:
              finalData.isActive !== undefined ? finalData.isActive : true,
            departmentId: finalData.departmentId || "dept-1",
            roleId: finalData.roleId || "role-1",
            projectIds: finalData.projectIds || ["project-1", "project-2"],
            skillIds: finalData.skillIds || ["skill-1", "skill-2"],
          },
        });
      }, options.delay);
    });
  };

  // Override the mock API with our spy that wraps the original function
  mockApi.useUsersControllerCreateMutation = () => [
    (data: any) => {
      // Create a modified data object with reference fields from model state
      const modifiedData = modelStateRef
        ? {
            createUserDto: {
              ...data.createUserDto,
              departmentId: modelStateRef.current.departmentId,
              roleId: modelStateRef.current.roleId,
              projectIds: modelStateRef.current.projectIds,
              skillIds: modelStateRef.current.skillIds,
            },
          }
        : data;

      // Call the spy with the modified data
      createMutationSpy(modifiedData);

      // Then call the original function with the original data
      // (the function will use modelStateRef internally)
      return createFn(data);
    },
    { isLoading: false },
  ];

  return { mockApi, createMutationSpy };
};

/**
 * Create a mock API with a spy for the update mutation
 */
export const createMockApiWithUpdateSpy = (
  options = { delay: 300 }, // Increased default delay
  modelStateRef?: any
) => {
  const mockApi = createMockApi(options);
  const updateMutationSpy = cy.spy().as("updateMutationSpy");

  // Override the update mutation with our spy
  mockApi.useUsersControllerUpdateMutation = () => [
    (data: any) => {
      // Create a modified data object with reference fields from model state
      const modifiedData = modelStateRef
        ? {
            _id: data._id,
            updateUserDto: {
              ...data.updateUserDto,
              departmentId: modelStateRef.current.departmentId,
              roleId: modelStateRef.current.roleId,
              projectIds: modelStateRef.current.projectIds,
              skillIds: modelStateRef.current.skillIds,
            },
          }
        : data;

      // Call the spy with the modified data
      updateMutationSpy(modifiedData);

      // Extract the actual data from the wrapper object
      const userData = data.updateUserDto || data;

      // Create a promise that resolves after a short delay
      return new Cypress.Promise((resolve) => {
        setTimeout(() => {
          // Use model state if provided, otherwise use form data
          const finalData = modelStateRef
            ? {
                ...userData,
                departmentId: modelStateRef.current.departmentId,
                roleId: modelStateRef.current.roleId,
                projectIds: modelStateRef.current.projectIds,
                skillIds: modelStateRef.current.skillIds,
              }
            : userData;

          // Log the data being used (using console.log instead of cy.log to avoid Promise issues)
          console.log(`Using data for API call:`, finalData);

          // Dispatch action to Redux store
          const action = userUpdated({
            _id: data._id || "user-1",
            ...finalData,
          });
          store.dispatch(action);

          resolve({ data: finalData });
        }, options.delay);
      });
    },
    { isLoading: false },
  ];

  return { mockApi, updateMutationSpy };
};

/**
 * Create a model state tracker for Redux integration
 */
export const createModelStateTracker = (initialModelData: any) => {
  const modelState = {
    current: { ...initialModelData },
  };

  // Create an object data selector function for Redux integration
  const objectDataSelector = (objectType: string, objectId?: string) => {
    return modelState.current;
  };

  // Create an action creator for updating object data in Redux
  const objectCreateUpdateAction = (
    key: string,
    data: Record<string, any>,
    merge = true
  ) => {
    // Update our model state with the new data
    if (merge) {
      modelState.current = { ...modelState.current, ...data };
    } else {
      // Ensure we maintain the required structure even when not merging
      modelState.current = {
        name: data.name || initialModelData.name,
        email: data.email || initialModelData.email,
        isActive:
          data.isActive !== undefined
            ? data.isActive
            : initialModelData.isActive,
        departmentId: data.departmentId || initialModelData.departmentId,
        roleId: data.roleId || initialModelData.roleId,
        projectIds: data.projectIds || initialModelData.projectIds,
        skillIds: data.skillIds || initialModelData.skillIds,
        ...data,
      };
    }

    // Log the updated state for debugging (using console.log instead of cy.log to avoid Promise issues)
    console.log(`Updated model state:`, modelState.current);

    // Return a Redux-like action
    return {
      type: "UPDATE_OBJECT_DATA",
      payload: {
        key,
        data,
        merge,
      },
    };
  };

  return { modelState, objectDataSelector, objectCreateUpdateAction };
};

/**
 * Mount the ObjectForm component with common props
 */
export const mountObjectForm = ({
  isNew = true,
  model = emptyModel,
  api,
  onSuccess = cy.spy().as("onSuccessSpy"),
  onAdd,
  onUpdate,
  successMessage = isNew
    ? "User created successfully"
    : "User updated successfully",
  objectDispatch,
  objectCreateUpdateAction,
  objectDataSelector,
}: {
  isNew?: boolean;
  model?: any;
  api: ObjectFormApiInterface;
  onSuccess?: Cypress.Agent<sinon.SinonSpy>;
  onAdd?: Cypress.Agent<sinon.SinonSpy>;
  onUpdate?: Cypress.Agent<sinon.SinonSpy>;
  successMessage?: string;
  objectDispatch?: any;
  objectCreateUpdateAction?: any;
  objectDataSelector?: any;
}) => {
  // Mount the component with NotificationProvider and Redux Provider
  mount(
    <Provider store={store}>
      <NotificationProvider>
        <ObjectForm
          schema={userBridge}
          objectType="User"
          isNew={isNew}
          model={model}
          api={api}
          onSuccess={onSuccess}
          onAdd={onAdd}
          onUpdate={onUpdate}
          successMessage={successMessage}
          objectDispatch={objectDispatch}
          objectCreateUpdateAction={objectCreateUpdateAction}
          objectDataSelector={objectDataSelector}
        />
      </NotificationProvider>
    </Provider>
  );

  return objectForm({ objectType: "User" });
};

/**
 * Fill out the form with basic field values
 */
export const fillBasicFields = (form: any, name: string, email: string) => {
  form.setFieldValue("name", name);
  form.setFieldValue("email", email);
  return cy.wait(200); // Wait for form updates to process
};

/**
 * Submit the form and wait for completion
 */
export const submitFormAndWaitForCompletion = (
  form: any,
  successMessage: string
) => {
  // Submit the form
  form.submit();

  // Wait for the loading indicator to complete with a longer timeout
  circularProgress({
    dataTestId: "ObjectFormLoadingIndicator",
  }).waitForCompletion(10000);

  // Check if the success notification is displayed with a longer timeout
  snackbar({ variant: "success" }).waitForMessage(successMessage, 10000);

  // Add an additional wait to ensure Redux store is updated
  return cy.wait(500);
};

/**
 * Helper function to verify spy assertions without direct cy.get() calls
 */
export const verifySpy = (alias: string, assertion: string, ...args: any[]) => {
  return cy.get(`@${alias}`).should(assertion, ...args);
};

/**
 * Verify the Redux store was updated with the expected values
 */
export const verifyReduxStoreUpdate = (
  entityId: string,
  expectedValues: Record<string, any>
) => {
  return cy.wait(500).then(() => {
    const state = store.getState();

    // Check if entity exists in the store
    expect(state.users.entities).to.have.property(entityId);

    // Verify each expected value
    Object.entries(expectedValues).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        expect(state.users.entities[entityId][key]).to.deep.equal(value);
      } else {
        expect(state.users.entities[entityId][key]).to.equal(value);
      }
    });
  });
};
