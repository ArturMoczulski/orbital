import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Message, characterSlice } from "../../../store";
import MessageList from "./MessageList";

// Mock messages
const mockMessages: Message[] = [
  {
    id: "msg1",
    content: "Hello there!",
    sender: "user" as const,
    timestamp: "2025-07-19T12:00:00Z",
  },
  {
    id: "msg2",
    content: "Hi! How can I help you today?",
    sender: "character" as const,
    timestamp: "2025-07-19T12:01:00Z",
  },
  {
    id: "msg3",
    content: "I have a question about your background.",
    sender: "user" as const,
    timestamp: "2025-07-19T12:02:00Z",
  },
];

describe("MessageList Component", () => {
  beforeEach(() => {
    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });
  });

  it("should render messages correctly", () => {
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageList messages={mockMessages} characterName="Lexi Blake" />
      </Provider>
    );

    // Check that all messages are displayed
    cy.contains("Hello there!").should("exist");
    cy.contains("Hi! How can I help you today?").should("exist");
    cy.contains("I have a question about your background.").should("exist");

    // Check that there are 3 message bubbles
    cy.get(".MuiPaper-root").should("have.length", 3);
  });

  it("should display empty state when no messages", () => {
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageList messages={[]} characterName="Lexi Blake" />
      </Provider>
    );

    // Check that the empty state message is displayed
    cy.contains(
      "No messages yet. Start a conversation with Lexi Blake."
    ).should("exist");

    // Check that there are no message bubbles
    cy.get(".MuiPaper-root").should("not.exist");
  });

  it("should display loading state when isLoading is true", () => {
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageList
          messages={mockMessages}
          characterName="Lexi Blake"
          isLoading={true}
        />
      </Provider>
    );

    // Check that the loading indicator is displayed
    cy.get(".MuiCircularProgress-root").should("exist");
    cy.contains("Loading messages...").should("exist");

    // Check that messages are not displayed when loading
    cy.contains("Hello there!").should("not.exist");
  });

  it("should have a scrollable container", () => {
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageList messages={mockMessages} characterName="Lexi Blake" />
      </Provider>
    );

    // Check that the container has a fixed height and overflow
    cy.get(".MuiBox-root").first().should("have.css", "height", "400px");
    cy.get(".MuiBox-root").first().should("have.css", "overflow-y", "auto");
  });

  it("should handle many messages", () => {
    // Create a large number of messages
    const manyMessages: Message[] = Array.from({ length: 20 }, (_, i) => ({
      id: `msg${i}`,
      content: `Message ${i}`,
      sender: i % 2 === 0 ? ("user" as const) : ("character" as const),
      timestamp: new Date(2025, 6, 19, 12, i).toISOString(),
    }));

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <MessageList messages={manyMessages} characterName="Lexi Blake" />
      </Provider>
    );

    // Check that the first and last messages are displayed
    cy.contains("Message 0").should("exist");
    cy.contains("Message 19").should("exist");

    // Check that there are 20 message bubbles
    cy.get(".MuiPaper-root").should("have.length", 20);
  });
});
