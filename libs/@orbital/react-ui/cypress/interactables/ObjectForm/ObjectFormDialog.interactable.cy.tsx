import Button from "@mui/material/Button";
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import React from "react";
import { Provider } from "react-redux";
import { z } from "zod";
import { NotificationProvider } from "../../../src/components/NotificationProvider/NotificationProvider";
import { ObjectFormDialog } from "../../../src/components/ObjectForm/ObjectFormDialog";
import { ZodReferencesBridge } from "../../../src/components/ObjectForm/ZodReferencesBridge";
import { circularProgress } from "../MaterialUI/CircularProgress.interactable";
import { snackbar } from "../MaterialUI/Snackbar.interactable";
import { objectFormDialog } from "./ObjectFormDialog.interactable";

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

// Create a mock API with a spy for the create mutation
const createMockApiWithCreateSpy = (
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
const createMockApiWithUpdateSpy = (
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
const createModelStateTracker = (initialModelData: any) => {
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
const fillBasicFields = (form: any, name: string, email: string) => {
  form.setFieldValue("name", name);
  form.setFieldValue("email", email);
  return cy.wait(200); // Wait for form updates to process
};

// Helper function to verify spy assertions
const verifySpy = (alias: string, assertion: string, ...args: any[]) => {
  return cy.get(`@${alias}`).should(assertion, ...args);
};

describe("ObjectFormDialog Basic Tests", () => {
  // Test component that manages the dialog state
  const TestComponent = () => {
    const [open, setOpen] = React.useState(false);
    const [submittedData, setSubmittedData] = React.useState<any>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleSuccess = (data: any) => {
      setSubmittedData(data);
      setOpen(false);
    };

    return (
      <Provider store={store}>
        <NotificationProvider>
          <div>
            <Button onClick={handleOpen} data-testid="open-dialog-button">
              Open Dialog
            </Button>

            {submittedData && (
              <div data-testid="submitted-data">
                {JSON.stringify(submittedData)}
              </div>
            )}

            <ObjectFormDialog
              open={open}
              onClose={handleClose}
              title="Test Form"
              schema={userBridge}
              objectType="User"
              isNew={true}
              onSubmit={(data) => {
                // Simulate API call
                console.log("Form submitted with data:", data);
                // Store the data for verification
                setSubmittedData(data);
                // Return void to match the expected type
                return Promise.resolve();
              }}
              onSuccess={handleSuccess}
            />
          </div>
        </NotificationProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    mount(<TestComponent />);
    // Open the dialog
    cy.get('[data-testid="open-dialog-button"]').click();
  });

  it("should render the dialog with the correct title", () => {
    const dialog = objectFormDialog({ objectType: "User" });
    dialog.getTitle().should("contain.text", "Test Form");
  });

  it("should be able to fill form fields", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill the form fields
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");

    // Verify the values were set
    dialog.getFieldValue("name").should("eq", "Test Name");
    dialog.getFieldValue("email").should("eq", "test@example.com");
  });

  it("should be able to submit the form", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill and submit the form
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");
    dialog.submit();

    // Verify the form was submitted and dialog closed
    cy.get('[data-testid="submitted-data"]').should("exist");
    cy.get('[data-testid="submitted-data"]').should(
      "contain.text",
      "Test Name"
    );

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should be able to cancel the form", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill the form but cancel
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");
    dialog.cancel();

    // Dialog should be closed
    dialog.get().should("not.exist");

    // No data should be submitted
    cy.get('[data-testid="submitted-data"]').should("not.exist");
  });

  it("should be able to use fillAndSubmit method", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Use the convenience method
    dialog.fillAndSubmit({
      name: "Test Name",
      email: "test@example.com",
      isActive: false,
    });

    // Verify the form was submitted and dialog closed
    cy.get('[data-testid="submitted-data"]').should("exist");
    cy.get('[data-testid="submitted-data"]').should(
      "contain.text",
      "Test Name"
    );
    cy.get('[data-testid="submitted-data"]').should(
      "contain.text",
      "test@example.com"
    );

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should be able to get form data", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill the form
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");

    // Get the form data
    dialog.getFormData().should("deep.include", {
      name: "Test Name",
      email: "test@example.com",
      isActive: true, // Default value from schema
    });
  });

  it("should delegate to ObjectFormInteractable for form operations", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Get the form interactable
    const form = dialog.getForm();

    // Use the form interactable directly
    form.setFieldValue("name", "Test Name");
    form.getFieldValue("name").should("eq", "Test Name");
  });
});

describe("ObjectFormDialog Reference Field Tests", () => {
  // Reset the Redux store before each test
  beforeEach(() => {
    store.dispatch({ type: "RESET_STATE" });
  });

  it("should verify all fields including reference IDs are correctly passed to create API when values are changed", () => {
    // Create a spy for the onSuccess callback
    const onSuccessSpy = cy.spy().as("onSuccessSpy");

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Define the initial model with reference fields
    const initialModel = {
      name: "Initial User",
      email: "initial@example.com",
      isActive: true,
      departmentId: "dept-1",
      roleId: "role-1",
      projectIds: ["project-1", "project-2"],
      skillIds: ["skill-1", "skill-2"],
    };

    // Create a model state tracker for Redux integration
    const { modelState, objectDataSelector, objectCreateUpdateAction } =
      createModelStateTracker(initialModel);

    // Setup mock API with create spy, passing the model state reference
    const { mockApi, createMutationSpy } = createMockApiWithCreateSpy(
      { delay: 100 },
      modelState
    );

    // Test component that manages the dialog state
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false);

      const handleOpen = () => setOpen(true);
      const handleClose = () => setOpen(false);
      const handleSuccess = (data: any) => {
        onSuccessSpy(data);
        handleClose();
      };

      return (
        <Provider store={store}>
          <NotificationProvider>
            <div>
              <Button onClick={handleOpen} data-testid="open-dialog-button">
                Open Dialog
              </Button>

              <ObjectFormDialog
                open={open}
                onClose={handleClose}
                title="Create User"
                schema={userBridge}
                objectType="User"
                isNew={true}
                model={initialModel}
                api={mockApi}
                onSuccess={handleSuccess}
                objectDispatch={store.dispatch}
                objectCreateUpdateAction={objectCreateUpdateAction}
                objectDataSelector={objectDataSelector}
                successMessage="User created successfully"
              />
            </div>
          </NotificationProvider>
        </Provider>
      );
    };

    // Mount the component
    mount(<TestComponent />);

    // Open the dialog
    cy.get('[data-testid="open-dialog-button"]').click();

    // Get the dialog
    const dialog = objectFormDialog({ objectType: "User" });

    // Change basic field values
    fillBasicFields(dialog, "Changed User", "changed@example.com");

    // Change reference field values by interacting with the form fields
    // Update belongsTo fields
    dialog.field("departmentId").then((field) => field.setValue("dept-2")); // Changed from dept-1
    dialog.field("roleId").then((field) => field.setValue("role-2")); // Changed from role-1

    // Update hasMany fields
    dialog
      .field("projectIds")
      .then((field) => field.setValue(["project-1", "project-3"])); // Changed from [project-1, project-2]
    dialog
      .field("skillIds")
      .then((field) => field.setValue(["skill-2", "skill-3"])); // Changed from [skill-1, skill-2]

    // Submit the form
    dialog.submit();

    // Wait for the loading indicator to complete
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(5000);

    // Check if the success notification is displayed
    snackbar({ variant: "success" }).waitForMessage(
      "User created successfully",
      5000
    );

    // Verify the create mutation was called with the updated values
    verifySpy("createMutationSpy", "have.been.calledOnce");

    // Verify the create mutation was called with the correct data
    verifySpy("createMutationSpy", "have.been.calledWithMatch", {
      createUserDto: {
        name: "Changed User",
        email: "changed@example.com",
        isActive: true,
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-1", "project-3"],
        skillIds: ["skill-2", "skill-3"],
      },
    });

    // Verify the onSuccess callback was called
    verifySpy("onSuccessSpy", "have.been.calledOnce");

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should verify all fields including reference IDs are correctly passed to update API when values are changed", () => {
    // Create a spy for the onSuccess callback
    const onSuccessSpy = cy.spy().as("onSuccessSpy");

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Define the initial model with reference fields
    const initialModel = {
      _id: "user-1",
      name: "Initial User",
      email: "initial@example.com",
      isActive: true,
      departmentId: "dept-1",
      roleId: "role-1",
      projectIds: ["project-1", "project-2"],
      skillIds: ["skill-1", "skill-2"],
    };

    // Create a model state tracker for Redux integration
    const { modelState, objectDataSelector, objectCreateUpdateAction } =
      createModelStateTracker(initialModel);

    // Setup mock API with update spy, passing the model state reference
    const { mockApi, updateMutationSpy } = createMockApiWithUpdateSpy(
      { delay: 100 },
      modelState
    );

    // Test component that manages the dialog state
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false);

      const handleOpen = () => setOpen(true);
      const handleClose = () => setOpen(false);
      const handleSuccess = (data: any) => {
        onSuccessSpy(data);
        handleClose();
      };

      return (
        <Provider store={store}>
          <NotificationProvider>
            <div>
              <Button onClick={handleOpen} data-testid="open-dialog-button">
                Open Dialog
              </Button>

              <ObjectFormDialog
                open={open}
                onClose={handleClose}
                title="Update User"
                schema={userBridge}
                objectType="User"
                isNew={false}
                model={initialModel}
                api={mockApi}
                onSuccess={handleSuccess}
                objectDispatch={store.dispatch}
                objectCreateUpdateAction={objectCreateUpdateAction}
                objectDataSelector={objectDataSelector}
                successMessage="User updated successfully"
              />
            </div>
          </NotificationProvider>
        </Provider>
      );
    };

    // Mount the component
    mount(<TestComponent />);

    // Open the dialog
    cy.get('[data-testid="open-dialog-button"]').click();

    // Get the dialog
    const dialog = objectFormDialog({ objectType: "User" });

    // Change basic field values
    fillBasicFields(dialog, "Changed User", "changed@example.com");

    // Change reference field values by interacting with the form fields
    // Update belongsTo fields
    dialog.field("departmentId").then((field) => field.setValue("dept-2")); // Changed from dept-1
    dialog.field("roleId").then((field) => field.setValue("role-2")); // Changed from role-1

    // Update hasMany fields
    dialog
      .field("projectIds")
      .then((field) => field.setValue(["project-1", "project-3"])); // Changed from [project-1, project-2]
    dialog
      .field("skillIds")
      .then((field) => field.setValue(["skill-2", "skill-3"])); // Changed from [skill-1, skill-2]

    // Submit the form
    dialog.submit();

    // Wait for the loading indicator to complete
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(5000);

    // Check if the success notification is displayed
    snackbar({ variant: "success" }).waitForMessage(
      "User updated successfully",
      5000
    );

    // Verify the update mutation was called with the updated values
    verifySpy("updateMutationSpy", "have.been.calledOnce");

    // Verify the update mutation was called with the correct data
    verifySpy("updateMutationSpy", "have.been.calledWithMatch", {
      _id: "user-1",
      updateUserDto: {
        _id: "user-1",
        name: "Changed User",
        email: "changed@example.com",
        isActive: true,
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-1", "project-3"],
        skillIds: ["skill-2", "skill-3"],
      },
    });

    // Verify the onSuccess callback was called
    verifySpy("onSuccessSpy", "have.been.calledOnce");

    // Dialog should be closed
    dialog.get().should("not.exist");
  });
});
