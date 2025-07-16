import Button from "@mui/material/Button";
import { mount } from "cypress/react";
import React from "react";
import { ObjectFormDialog } from "../../../src/components/ObjectForm/ObjectFormDialog";
import { circularProgress } from "../MaterialUI/CircularProgress.interactable";
import { snackbar } from "../MaterialUI/Snackbar.interactable";
import {
  createModelStateTracker,
  fillBasicFields,
  store,
  TestWrapper,
  userBridge,
  verifySpy,
} from "./ObjectFormDialog.api.utils";
import { objectFormDialog } from "./ObjectFormDialog.interactable";

describe("ObjectFormDialog Error Handling Tests", () => {
  // Reset the Redux store before each test
  beforeEach(() => {
    store.dispatch({ type: "RESET_STATE" });
  });

  it("should display an error notification when the create API call fails", () => {
    // Create a spy for the onError callback
    const onErrorSpy = cy.spy().as("onErrorSpy");

    // Define the initial model
    const initialModel = {
      name: "Test User",
      email: "test@example.com",
      isActive: true,
      departmentId: "dept-1",
      roleId: "role-1",
      projectIds: ["project-1"],
      skillIds: ["skill-1"],
    };

    // Create a model state tracker for Redux integration
    const { modelState, objectDataSelector, objectCreateUpdateAction } =
      createModelStateTracker(initialModel);

    // Create a mock API with a create mutation that fails
    const mockApi = {
      useCreateMutation: () => {
        const createMutationSpy = cy.spy().as("createMutationSpy");
        return [
          (data: any) => {
            createMutationSpy(data);
            return Promise.reject({
              status: 500,
              data: { message: "Server error during create" },
            });
          },
          { isLoading: false, error: null },
        ];
      },
      useUpdateMutation: () => [() => {}, { isLoading: false, error: null }],
    };

    // Test component that manages the dialog state
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false);

      const handleOpen = () => setOpen(true);
      const handleClose = () => setOpen(false);
      const handleError = (error: any) => {
        onErrorSpy(error);
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
              onError={handleError}
              objectDispatch={store.dispatch}
              objectCreateUpdateAction={objectCreateUpdateAction}
              objectDataSelector={objectDataSelector}
              successMessage="User created successfully"
              errorMessage="Failed to create user"
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

    // Fill in the form fields
    fillBasicFields(dialog, "Error Test User", "error@example.com");

    // Submit the form
    dialog.submit();

    // Wait for the loading indicator to complete
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(5000);

    // Check if the error notification is displayed
    snackbar({ variant: "error" }).waitForMessage(
      "Failed to create user",
      5000
    );

    // Verify the create mutation was called
    verifySpy("createMutationSpy", "have.been.calledOnce");

    // Verify the onError callback was called
    verifySpy("onErrorSpy", "have.been.calledOnce");

    // Dialog should still be open
    dialog.get().should("exist");
  });

  it("should display an error notification when the update API call fails", () => {
    // Create a spy for the onError callback
    const onErrorSpy = cy.spy().as("onErrorSpy");

    // Define the initial model
    const initialModel = {
      _id: "user-1",
      name: "Test User",
      email: "test@example.com",
      isActive: true,
      departmentId: "dept-1",
      roleId: "role-1",
      projectIds: ["project-1"],
      skillIds: ["skill-1"],
    };

    // Create a model state tracker for Redux integration
    const { modelState, objectDataSelector, objectCreateUpdateAction } =
      createModelStateTracker(initialModel);

    // Create a mock API with an update mutation that fails
    const mockApi = {
      useCreateMutation: () => [() => {}, { isLoading: false, error: null }],
      useUpdateMutation: () => {
        const updateMutationSpy = cy.spy().as("updateMutationSpy");
        return [
          (data: any) => {
            updateMutationSpy(data);
            return Promise.reject({
              status: 500,
              data: { message: "Server error during update" },
            });
          },
          { isLoading: false, error: null },
        ];
      },
    };

    // Test component that manages the dialog state
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false);

      const handleOpen = () => setOpen(true);
      const handleClose = () => setOpen(false);
      const handleError = (error: any) => {
        onErrorSpy(error);
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
              onError={handleError}
              objectDispatch={store.dispatch}
              objectCreateUpdateAction={objectCreateUpdateAction}
              objectDataSelector={objectDataSelector}
              successMessage="User updated successfully"
              errorMessage="Failed to update user"
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

    // Fill in the form fields
    fillBasicFields(dialog, "Error Test User", "error@example.com");

    // Submit the form
    dialog.submit();

    // Wait for the loading indicator to complete
    circularProgress({
      dataTestId: "ObjectFormLoadingIndicator",
    }).waitForCompletion(5000);

    // Check if the error notification is displayed
    snackbar({ variant: "error" }).waitForMessage(
      "Failed to update user",
      5000
    );

    // Verify the update mutation was called
    verifySpy("updateMutationSpy", "have.been.calledOnce");

    // Verify the onError callback was called
    verifySpy("onErrorSpy", "have.been.calledOnce");

    // Dialog should still be open
    dialog.get().should("exist");
  });

  it("should validate form fields and prevent submission with invalid data", () => {
    // Define the initial model
    const initialModel = {
      name: "",
      email: "",
      isActive: true,
      departmentId: "dept-1",
      roleId: "role-1",
      projectIds: ["project-1"],
      skillIds: ["skill-1"],
    };

    // Create a model state tracker for Redux integration
    const { modelState, objectDataSelector, objectCreateUpdateAction } =
      createModelStateTracker(initialModel);

    // Create a mock API with a create mutation spy
    const createMutationSpy = cy.spy().as("createMutationSpy");
    const mockApi = {
      useCreateMutation: () => [
        (data: any) => {
          createMutationSpy(data);
          return Promise.resolve({
            data: { ...data.createUserDto, _id: "new-id" },
          });
        },
        { isLoading: false, error: null },
      ],
      useUpdateMutation: () => [() => {}, { isLoading: false, error: null }],
    };

    // Test component that manages the dialog state
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false);

      const handleOpen = () => setOpen(true);
      const handleClose = () => setOpen(false);

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

    // Submit the form without filling required fields
    dialog.submit();

    // Verify the create mutation was not called
    cy.get("@createMutationSpy").should("not.have.been.called");

    // Verify validation error messages are displayed
    cy.contains("Name is required").should("be.visible");
    cy.contains("Email is required").should("be.visible");

    // Dialog should still be open
    dialog.get().should("exist");
  });
});
