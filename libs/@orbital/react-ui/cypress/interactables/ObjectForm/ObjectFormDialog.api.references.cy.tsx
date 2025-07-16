import Button from "@mui/material/Button";
import { mount } from "cypress/react";
import React from "react";
import { ObjectFormDialog } from "../../../src/components/ObjectForm/ObjectFormDialog";
import { circularProgress } from "../MaterialUI/CircularProgress.interactable";
import { snackbar } from "../MaterialUI/Snackbar.interactable";
import {
  createMockApiWithCreateSpy,
  createMockApiWithUpdateSpy,
  createModelStateTracker,
  fillBasicFields,
  store,
  TestWrapper,
  userBridge,
  verifySpy,
} from "./ObjectFormDialog.api.utils";
import { objectFormDialog } from "./ObjectFormDialog.interactable";

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
        <TestWrapper>
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
        </TestWrapper>
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
        <TestWrapper>
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
        </TestWrapper>
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
