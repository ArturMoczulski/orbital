import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { characterSlice } from "../../../store";
import NewThreadButton from "./NewThreadButton";

describe("NewThreadButton Component", () => {
  beforeEach(() => {
    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });
  });

  it("should render correctly", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} />
      </Provider>
    );

    // Check that the button exists
    cy.get("button").should("exist");

    // Check that the button has the correct icon
    cy.get("button svg").should("exist");
  });

  it("should open the dialog when clicked", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} />
      </Provider>
    );

    // Click the button
    cy.get("button").click();

    // Check that the dialog is open
    cy.contains("Create New Conversation").should("be.visible");
    cy.get("input").should("exist");
    cy.get("button").contains("Cancel").should("exist");
    cy.get("button").contains("Create").should("exist");
  });

  it("should close the dialog when Cancel is clicked", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} />
      </Provider>
    );

    // Click the button to open the dialog
    cy.get("button").click();

    // Click the Cancel button
    cy.contains("Cancel").click();

    // Check that the dialog is closed
    cy.contains("Create New Conversation").should("not.exist");

    // Verify the onCreateThread handler was not called
    cy.get("@onCreateThreadSpy").should("not.have.been.called");
  });

  it("should call onCreateThread when Create is clicked with valid input", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} />
      </Provider>
    );

    // Click the button to open the dialog
    cy.get("button").click();

    // Type a valid thread name
    cy.get("input").type("test_thread");

    // Click the Create button
    cy.contains("Create").click();

    // Verify the onCreateThread handler was called with the correct thread name
    cy.get("@onCreateThreadSpy").should("have.been.calledWith", "test_thread");

    // Check that the dialog is closed
    cy.contains("Create New Conversation").should("not.exist");
  });

  it("should show an error for empty thread name", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} />
      </Provider>
    );

    // Click the button to open the dialog
    cy.get("button").click();

    // Click the Create button without entering a name
    cy.contains("Create").click();

    // Check that an error message is displayed
    cy.contains("Thread name cannot be empty").should("be.visible");

    // Verify the onCreateThread handler was not called
    cy.get("@onCreateThreadSpy").should("not.have.been.called");

    // Dialog should still be open
    cy.contains("Create New Conversation").should("be.visible");
  });

  it("should show an error for invalid thread name", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} />
      </Provider>
    );

    // Click the button to open the dialog
    cy.get("button").click();

    // Type an invalid thread name (with spaces)
    cy.get("input").type("invalid thread name");

    // Click the Create button
    cy.contains("Create").click();

    // Check that an error message is displayed
    cy.contains(
      "Thread name can only contain letters, numbers, dashes, and underscores"
    ).should("be.visible");

    // Verify the onCreateThread handler was not called
    cy.get("@onCreateThreadSpy").should("not.have.been.called");

    // Dialog should still be open
    cy.contains("Create New Conversation").should("be.visible");
  });

  it("should be disabled when the disabled prop is true", () => {
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <NewThreadButton onCreateThread={onCreateThreadSpy} disabled={true} />
      </Provider>
    );

    // Check that the button is disabled
    cy.get("button").should("be.disabled");
  });
});
