import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { characterSlice } from "../../../store";
import MessageInput from "./MessageInput";

describe("MessageInput Component", () => {
  beforeEach(() => {
    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });
  });

  it("should render correctly", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} />
      </Provider>
    );

    // Check that the input field exists
    cy.get("input").should("exist");
    cy.get("input").should("have.attr", "placeholder", "Type a message...");

    // Check that the send button exists and is disabled initially
    cy.get("button").should("exist");
    cy.get("button").should("be.disabled");
  });

  it("should enable the send button when text is entered", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} />
      </Provider>
    );

    // Type a message
    cy.get("input").type("Hello, world!");

    // Check that the send button is enabled
    cy.get("button").should("not.be.disabled");
  });

  it("should call onSendMessage when the send button is clicked", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} />
      </Provider>
    );

    // Type a message
    cy.get("input").type("Hello, world!");

    // Click the send button
    cy.get("button").click();

    // Verify the onSendMessage handler was called with the correct message
    cy.get("@onSendMessageSpy").should("have.been.calledWith", "Hello, world!");

    // Check that the input field is cleared after sending
    cy.get("input").should("have.value", "");
  });

  it("should call onSendMessage when Enter is pressed", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} />
      </Provider>
    );

    // Type a message and press Enter
    cy.get("input").type("Hello, world!{enter}");

    // Verify the onSendMessage handler was called with the correct message
    cy.get("@onSendMessageSpy").should("have.been.calledWith", "Hello, world!");

    // Check that the input field is cleared after sending
    cy.get("input").should("have.value", "");
  });

  it("should not call onSendMessage when Shift+Enter is pressed", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} />
      </Provider>
    );

    // Type a message and press Shift+Enter
    cy.get("input").type("Hello, world!{shift}{enter}");

    // Verify the onSendMessage handler was not called
    cy.get("@onSendMessageSpy").should("not.have.been.called");
  });

  it("should not call onSendMessage when the input is empty", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} />
      </Provider>
    );

    // Press Enter without typing anything
    cy.get("input").type("{enter}");

    // Verify the onSendMessage handler was not called
    cy.get("@onSendMessageSpy").should("not.have.been.called");
  });

  it("should be disabled when the disabled prop is true", () => {
    const onSendMessageSpy = cy.spy().as("onSendMessageSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageInput onSendMessage={onSendMessageSpy} disabled={true} />
      </Provider>
    );

    // Check that the input field is disabled
    cy.get("input").should("be.disabled");

    // Check that the send button is disabled
    cy.get("button").should("be.disabled");
  });
});
