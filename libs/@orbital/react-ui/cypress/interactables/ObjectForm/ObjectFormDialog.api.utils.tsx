import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import React from "react";
import { Provider } from "react-redux";
import { z } from "zod";
import { NotificationProvider } from "../../../src/components/NotificationProvider/NotificationProvider";
import { ZodReferencesBridge } from "../../../src/components/ObjectForm/ZodReferencesBridge";

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
export const initialState = {
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

// Create a mock API with a spy for the create mutation
export const createMockApiWithCreateSpy = (
  options = { delay: 300 },
  modelStateRef?: any
) => {
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

  // Create the mock API object
  const mockApi: ObjectFormApiInterface = {
    useUsersControllerCreateMutation: () => [
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
        return createFn(data);
      },
      { isLoading: false },
    ],
  };

  return { mockApi, createMutationSpy };
};

// Create a mock API with a spy for the update mutation
export const createMockApiWithUpdateSpy = (
  options = { delay: 300 },
  modelStateRef?: any
) => {
  const updateMutationSpy = cy.spy().as("updateMutationSpy");

  // Create the mock API object
  const mockApi: ObjectFormApiInterface = {
    useUsersControllerUpdateMutation: () => [
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
    ],
  };

  return { mockApi, updateMutationSpy };
};

// Create a model state tracker for Redux integration
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

// Helper function to fill basic fields
export const fillBasicFields = (form: any, name: string, email: string) => {
  form.setFieldValue("name", name);
  form.setFieldValue("email", email);
  return cy.wait(200); // Wait for form updates to process
};

// Helper function to verify spy assertions
export const verifySpy = (alias: string, assertion: string, ...args: any[]) => {
  return cy.get(`@${alias}`).should(assertion, ...args);
};

// Wrapper component for tests that provides Redux and Notification context
export const TestWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <Provider store={store}>
      <NotificationProvider>{children}</NotificationProvider>
    </Provider>
  );
};
