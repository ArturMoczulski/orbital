import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Message, characterSlice } from "../../../store";
import MessageBubble from "./MessageBubble";

// Mock messages
const userMessage: Message = {
  id: "msg1",
  content: "This is a user message",
  sender: "user" as const,
  timestamp: "2025-07-19T12:00:00Z",
};

const characterMessage: Message = {
  id: "msg2",
  content: "This is a character message",
  sender: "character" as const,
  timestamp: "2025-07-19T12:05:00Z",
};

describe("MessageBubble Component", () => {
  beforeEach(() => {
    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });
  });

  it("should render a user message correctly", () => {
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageBubble message={userMessage} />
      </Provider>
    );

    // Check that the message content is displayed
    cy.contains("This is a user message").should("exist");

    // Check that the time is displayed
    const time = new Date(userMessage.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    cy.contains(time).should("exist");

    // User messages should be aligned to the right
    // Check that user messages are aligned to the right
    cy.get(".MuiPaper-root")
      .should("have.css", "margin-left")
      .and("not.equal", "0px");

    // User messages should have the primary color
    cy.get(".MuiPaper-root").should("have.css", "background-color");
  });

  it("should render a character message correctly", () => {
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageBubble message={characterMessage} />
      </Provider>
    );

    // Check that the message content is displayed
    cy.contains("This is a character message").should("exist");

    // Check that the time is displayed
    const time = new Date(characterMessage.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    cy.contains(time).should("exist");

    // Character messages should be aligned to the left
    // Check that character messages are aligned to the left
    cy.get(".MuiPaper-root")
      .should("have.css", "margin-right")
      .and("not.equal", "0px");

    // Character messages should have a grey background
    cy.get(".MuiPaper-root").should("have.css", "background-color");
  });

  it("should handle long messages", () => {
    const longMessage: Message = {
      id: "msg3",
      content:
        "This is a very long message that should wrap to multiple lines. It contains a lot of text to ensure that the message bubble can handle long content properly and display it in a readable way.",
      sender: "user" as const,
      timestamp: "2025-07-19T12:10:00Z",
    };

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageBubble message={longMessage} />
      </Provider>
    );

    // Check that the long message content is displayed
    cy.contains("This is a very long message").should("exist");

    // Check that the message has a maximum width
    cy.get(".MuiPaper-root").should("have.css", "max-width", "70%");
  });
});
