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

describe("ObjectFormDialog Redux Integration Tests", () => {
  // Reset the Redux store before each test
  beforeEach(() => {
    store.dispatch({ type: "RESET_STATE" });
  });

  it("should dispatch the objectCreateUpdateAction with the correct payload on successful create", () => {
    // Create a spy for the onSuccess callback
    const onSuccessSpy = cy.spy().as("onSuccessSpy");

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

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

    // Change field values
    fillBasicFields(dialog, "Redux Test User", "redux@example.com");

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

    // Verify the create mutation was called
    verifySpy("createMutationSpy", "have.been.calledOnce");

    // Verify the onSuccess callback was called
    verifySpy("onSuccessSpy", "have.been.calledOnce");

    // Verify the dispatch was called with the objectCreateUpdateAction
    cy.get("@dispatchSpy").should((spy: any) => {
      const calls = spy.getCalls ? spy.getCalls() : [];

      // Find the call with the objectCreateUpdateAction
      const actionCall = calls.find((call: any) => {
        const action = call.args[0];
        return action.type && action.type.includes("createUpdateUser");
      });

      expect(actionCall).to.exist;

      // Verify the action payload
      const action = actionCall.args[0];
      expect(action.payload).to.deep.include({
        name: "Redux Test User",
        email: "redux@example.com",
        isActive: true,
        _id: "new-id", // This comes from the mock API response
      });
    });

    // Verify the Redux store was updated with the new data
    cy.wrap(store.getState()).should((state: any) => {
      // Access the user data using the path from objectDataSelector
      const userData = objectDataSelector(state as any);
      expect(userData).to.deep.include({
        name: "Redux Test User",
        email: "redux@example.com",
        isActive: true,
        _id: "new-id",
      });
    });

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should dispatch the objectCreateUpdateAction with the correct payload on successful update", () => {
    // Create a spy for the onSuccess callback
    const onSuccessSpy = cy.spy().as("onSuccessSpy");

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

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

    // Change field values
    fillBasicFields(dialog, "Redux Updated User", "reduxupdated@example.com");

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

    // Verify the update mutation was called
    verifySpy("updateMutationSpy", "have.been.calledOnce");

    // Verify the onSuccess callback was called
    verifySpy("onSuccessSpy", "have.been.calledOnce");

    // Verify the dispatch was called with the objectCreateUpdateAction
    cy.get("@dispatchSpy").should((spy: any) => {
      const calls = spy.getCalls ? spy.getCalls() : [];

      // Find the call with the objectCreateUpdateAction
      const actionCall = calls.find((call: any) => {
        const action = call.args[0];
        return action.type && action.type.includes("createUpdateUser");
      });

      expect(actionCall).to.exist;

      // Verify the action payload
      const action = actionCall.args[0];
      expect(action.payload).to.deep.include({
        _id: "user-1",
        name: "Redux Updated User",
        email: "reduxupdated@example.com",
        isActive: true,
      });
    });

    // Verify the Redux store was updated with the new data
    cy.wrap(store.getState()).should((state: any) => {
      // Access the user data using the path from objectDataSelector
      const userData = objectDataSelector(state as any);
      expect(userData).to.deep.include({
        _id: "user-1",
        name: "Redux Updated User",
        email: "reduxupdated@example.com",
        isActive: true,
      });
    });

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should not dispatch the objectCreateUpdateAction when API call fails", () => {
    // Create a spy for the onError callback
    const onErrorSpy = cy.spy().as("onErrorSpy");

    // Create a spy for the store.dispatch function
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

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
    const createMutationSpy = cy.spy().as("createMutationSpy");
    const mockApi = {
      useCreateMutation: () => [
        (data: any) => {
          createMutationSpy(data);
          return Promise.reject({
            status: 500,
            data: { message: "Server error during create" },
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

    // Verify the objectCreateUpdateAction was not dispatched
    cy.get("@dispatchSpy").should((spy: any) => {
      const calls = spy.getCalls ? spy.getCalls() : [];

      // Find if there's any call with the objectCreateUpdateAction
      const actionCall = calls.find((call: any) => {
        const action = call.args[0];
        return action.type && action.type.includes("createUpdateUser");
      });

      // There should be no such call
      expect(actionCall).to.be.undefined;
    });

    // Dialog should still be open
    dialog.get().should("exist");
  });
});
