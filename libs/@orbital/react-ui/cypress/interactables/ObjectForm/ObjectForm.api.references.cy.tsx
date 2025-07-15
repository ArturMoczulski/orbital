import {
  createMockApiWithCreateSpy,
  createMockApiWithUpdateSpy,
  createModelStateTracker,
  fillBasicFields,
  mountObjectForm,
  store,
} from "./ObjectForm.api.utils";

describe("ObjectForm Reference Field Tests", () => {
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

    // Mount the form with Redux integration
    const form = mountObjectForm({
      isNew: true,
      model: initialModel,
      api: mockApi,
      onSuccess: onSuccessSpy,
      objectDispatch: store.dispatch,
      objectCreateUpdateAction,
      objectDataSelector,
    });

    // Change basic field values
    fillBasicFields(form, "Changed User", "changed@example.com");

    // Change reference field values by interacting with the form fields
    // Update belongsTo fields
    form.field("departmentId").then((field) => field.setValue("dept-2")); // Changed from dept-1
    form.field("roleId").then((field) => field.setValue("role-2")); // Changed from role-1

    // Update hasMany fields
    form
      .field("projectIds")
      .then((field) => field.setValue(["project-1", "project-3"])); // Changed from [project-1, project-2]
    form
      .field("skillIds")
      .then((field) => field.setValue(["skill-2", "skill-3"])); // Changed from [skill-1, skill-2]

    // Submit the form
    form.submit();

    // Verify the create mutation was called with the updated values
    cy.get("@createMutationSpy").should("have.been.calledOnce");

    // Verify the create mutation was called with the correct data
    cy.get("@createMutationSpy").should("have.been.calledWithMatch", {
      createUserDto: {
        name: "Changed User",
        email: "changed@example.com",
        isActive: true,
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-2", "project-3"],
        skillIds: ["skill-1", "skill-3"],
      },
    });
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

    // Mount the form with Redux integration
    const form = mountObjectForm({
      isNew: false,
      model: initialModel,
      api: mockApi,
      onSuccess: onSuccessSpy,
      objectDispatch: store.dispatch,
      objectCreateUpdateAction,
      objectDataSelector,
    });

    // Change basic field values
    fillBasicFields(form, "Changed User", "changed@example.com");

    // Change reference field values by interacting with the form fields
    // Update belongsTo fields
    form.field("departmentId").then((field) => field.setValue("dept-2")); // Changed from dept-1
    form.field("roleId").then((field) => field.setValue("role-2")); // Changed from role-1

    // Update hasMany fields
    form
      .field("projectIds")
      .then((field) => field.setValue(["project-1", "project-3"])); // Changed from [project-1, project-2]
    form
      .field("skillIds")
      .then((field) => field.setValue(["skill-2", "skill-3"])); // Changed from [skill-1, skill-2]

    // Submit the form
    form.submit();

    // Verify the update mutation was called with the updated values
    cy.get("@updateMutationSpy").should("have.been.calledOnce");

    // Verify the update mutation was called with the correct data
    cy.get("@updateMutationSpy").should("have.been.calledWithMatch", {
      _id: "user-1",
      updateUserDto: {
        _id: "user-1",
        name: "Changed User",
        email: "changed@example.com",
        isActive: true,
        departmentId: "dept-2",
        roleId: "role-2",
        projectIds: ["project-2", "project-3"],
        skillIds: ["skill-1", "skill-3"],
      },
    });
  });
});
