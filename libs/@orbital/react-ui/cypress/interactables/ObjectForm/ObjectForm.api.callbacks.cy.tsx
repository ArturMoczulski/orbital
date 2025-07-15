import { circularProgress } from "../MaterialUI/CircularProgress.interactable";
import { snackbar } from "../MaterialUI/Snackbar.interactable";
import {
  createMockApi,
  emptyModel,
  fillBasicFields,
  initialUser,
  mountObjectForm,
  store,
  verifySpy,
} from "./ObjectForm.api.utils";

describe("ObjectForm Custom Callback Tests", () => {
  // Reset the Redux store before each test
  beforeEach(() => {
    store.dispatch({ type: "RESET_STATE" });
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

      // Create a spy for the onSuccess callback
      const onSuccessSpy = cy.spy().as("onSuccessSpy");

      // Create a mock API
      const mockApi = createMockApi();

      // Mount the form
      const form = mountObjectForm({
        isNew: true,
        api: mockApi,
        onAdd: onAddSpy,
        onSuccess: onSuccessSpy,
        model: emptyModel,
      });

      // Fill out the form
      fillBasicFields(form, "Custom Add User", "custom@example.com");

      // Submit the form
      form.submit();

      // Verify the onAdd callback was called
      verifySpy("onAddSpy", "have.been.calledOnce");

      // Check that onAddSpy was called with an object containing these properties
      verifySpy("onAddSpy", "have.been.calledWithMatch", {
        name: "Custom Add User",
        email: "custom@example.com",
        isActive: true,
      });

      // Wait for the form submission to complete
      circularProgress({
        dataTestId: "ObjectFormLoadingIndicator",
      }).waitForCompletion(5000);

      // Check for the success notification
      snackbar({ variant: "success" }).waitForMessage(
        "User created successfully",
        5000
      );

      // Verify the onSuccess callback was called
      verifySpy("onSuccessSpy", "have.been.calledOnce");
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

      // Create a spy for the onSuccess callback
      const onSuccessSpy = cy.spy().as("onSuccessSpy");

      // Create a mock API
      const mockApi = createMockApi();

      // Mount the form
      const form = mountObjectForm({
        isNew: false,
        model: initialUser,
        api: mockApi,
        onUpdate: onUpdateSpy,
        onSuccess: onSuccessSpy,
      });

      // Update the form fields
      fillBasicFields(form, "Updated User", "updated@example.com");

      // Submit the form
      form.submit();

      // Verify the onUpdate callback was called
      verifySpy("onUpdateSpy", "have.been.calledOnce");
      verifySpy("onUpdateSpy", "have.been.calledWithMatch", {
        name: "Updated User",
        email: "updated@example.com",
        isActive: true,
      });

      // Wait for the form submission to complete
      circularProgress({
        dataTestId: "ObjectFormLoadingIndicator",
      }).waitForCompletion(5000);

      // Check for the success notification
      snackbar({ variant: "success" }).waitForMessage(
        "User updated successfully",
        5000
      );

      // Verify the onSuccess callback was called
      verifySpy("onSuccessSpy", "have.been.calledOnce");
    }
  );
});
