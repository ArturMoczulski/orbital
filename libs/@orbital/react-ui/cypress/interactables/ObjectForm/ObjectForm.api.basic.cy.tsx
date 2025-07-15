import { circularProgress } from "../MaterialUI/CircularProgress.interactable";
import { snackbar } from "../MaterialUI/Snackbar.interactable";
import {
  createMockApi,
  createMockApiWithCreateSpy,
  emptyModel,
  fillBasicFields,
  initialUser,
  mountObjectForm,
  store,
  submitFormAndWaitForCompletion,
  verifyReduxStoreUpdate,
} from "./ObjectForm.api.utils";

describe("ObjectForm Basic API Integration Tests", () => {
  // Reset the Redux store before each test
  beforeEach(() => {
    store.dispatch({ type: "RESET_STATE" });
  });

  it("should use the create mutation when isNew is true and update Redux state", () => {
    // Create spies
    const onSuccessSpy = cy.spy().as("onSuccessSpy");
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Setup mock API with create spy
    const { mockApi } = createMockApiWithCreateSpy();

    // Mount the form
    const form = mountObjectForm({
      isNew: true,
      api: mockApi,
      onSuccess: onSuccessSpy,
      model: emptyModel,
    });

    // Verify that the id field is not displayed when isNew is true
    cy.get('[data-field-name="id"]').should("not.exist");

    // Fill out the form
    fillBasicFields(form, "New User", "new@example.com");

    // Submit the form and wait for completion
    submitFormAndWaitForCompletion(form, "User created successfully");

    // Verify the create mutation was called
    cy.get("@createMutationSpy").should("have.been.calledOnce");

    // Verify the dispatch was called
    cy.get("@dispatchSpy").should("have.been.called");

    // Verify the Redux store was updated
    verifyReduxStoreUpdate("new-user-1", {
      name: "New User",
      email: "new@example.com",
    });

    // Verify the success callback was called
    cy.get("@onSuccessSpy").should("have.been.calledOnce");
  });

  it(
    "should update existing object with api object update mutation",
    { defaultCommandTimeout: 10000 },
    () => {
      // Create a spy for the onSuccess callback
      const onSuccessSpy = cy.spy().as("onSuccessSpy");

      // Create a mock API
      const mockApi = createMockApi();

      // Mount the form
      const form = mountObjectForm({
        isNew: false,
        model: initialUser,
        api: mockApi,
        onSuccess: onSuccessSpy,
      });

      // Update the form fields
      fillBasicFields(form, "API Updated User", "api-updated@example.com");

      // Submit the form and wait for completion
      submitFormAndWaitForCompletion(form, "User updated successfully");

      // Verify the onSuccess callback was called
      cy.get("@onSuccessSpy").should("have.been.calledOnce");
    }
  );

  it("should display loading indicator while api functions are running", () => {
    // Create a mock API with a longer delay
    const mockApi = createMockApi({ isLoading: false, delay: 500 });

    // Mount the form
    const form = mountObjectForm({
      isNew: true,
      api: mockApi,
      model: emptyModel,
    });

    // Fill out the form
    fillBasicFields(form, "Loading Test User", "loading@example.com");

    // Submit the form
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
});
