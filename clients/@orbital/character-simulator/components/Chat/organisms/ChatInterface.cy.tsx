import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { ConversationThread, characterSlice } from "../../../store";
import ChatInterface from "./ChatInterface";

// Mock conversation threads
const mockThreads: ConversationThread[] = [
  {
    id: "thread1",
    name: "General",
    messages: [
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
    ],
    createdAt: "2025-07-19T10:00:00Z",
    updatedAt: "2025-07-19T12:01:00Z",
  },
  {
    id: "thread2",
    name: "Work_Discussion",
    messages: [
      {
        id: "msg3",
        content: "Let's talk about work.",
        sender: "user" as const,
        timestamp: "2025-07-19T13:00:00Z",
      },
    ],
    createdAt: "2025-07-19T13:00:00Z",
    updatedAt: "2025-07-19T13:00:00Z",
  },
];

// Mock character service functions
const mockLoadConversationThreads = cy.stub().as("loadConversationThreads");
const mockSaveConversationThreads = cy.stub().as("saveConversationThreads");
const mockValidateThreadName = cy.stub().as("validateThreadName");

describe("ChatInterface Component", () => {
  beforeEach(() => {
    // Reset stubs
    mockLoadConversationThreads.reset();
    mockSaveConversationThreads.reset();
    mockValidateThreadName.reset();

    // Set up default stub behavior
    mockLoadConversationThreads.resolves(mockThreads);
    mockSaveConversationThreads.resolves(true);
    mockValidateThreadName.returns(true);

    // Stub the imported functions
    cy.stub(window, "require").callsFake((module) => {
      if (module === "../../../services/characterService") {
        return {
          loadConversationThreads: mockLoadConversationThreads,
          saveConversationThreads: mockSaveConversationThreads,
          validateThreadName: mockValidateThreadName,
        };
      }
      return window.require(module);
    });

    // Create a Redux store with preloaded state
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
      preloadedState: {
        character: {
          characters: [
            {
              id: "lexiblake",
              name: "Lexi Blake",
              filePath: "lexiblake",
            },
          ],
          selectedCharacterId: "lexiblake",
          lifeEvents: [],
          currentViewDate: null,
          availableDates: [],
          conversationThreads: mockThreads,
          selectedThreadId: "thread1",
          isLoading: false,
          error: null,
        },
      },
    });

    // Mount the component
    cy.mount(
      <Provider store={store}>
        <ChatInterface characterName="Lexi Blake" />
      </Provider>
    );
  });

  it("should render all child components", () => {
    // Check that the ThreadSelector is rendered
    cy.get("#thread-selector").should("exist");

    // Check that the MessageList is rendered
    cy.get(".MuiBox-root").contains("Hello there!").should("exist");
    cy.get(".MuiBox-root")
      .contains("Hi! How can I help you today?")
      .should("exist");

    // Check that the MessageInput is rendered
    cy.get("input[placeholder='Type a message...']").should("exist");
  });

  it("should load conversation threads on mount", () => {
    // Verify that loadConversationThreads was called with the correct character ID
    cy.get("@loadConversationThreads").should(
      "have.been.calledWith",
      "lexiblake"
    );
  });

  it("should allow sending a message", () => {
    // Type a message
    cy.get("input[placeholder='Type a message...']").type(
      "This is a test message{enter}"
    );

    // Check that the message appears in the message list
    cy.contains("This is a test message").should("exist");

    // Check that saveConversationThreads was called
    cy.get("@saveConversationThreads").should("have.been.called");
  });

  it("should simulate a character response after sending a message", () => {
    // Type a message
    cy.get("input[placeholder='Type a message...']").type(
      "This is a test message{enter}"
    );

    // Wait for the simulated character response (1 second delay)
    cy.wait(1000);

    // Check that a character response appears
    cy.contains("This is a simulated response from Lexi Blake").should("exist");
  });

  it("should allow switching between threads", () => {
    // Click to open the thread selector dropdown
    cy.get("#thread-selector").click();

    // Select the second thread
    cy.contains("Work_Discussion").click();

    // Check that the messages from the second thread are displayed
    cy.contains("Let's talk about work.").should("exist");
    cy.contains("Hello there!").should("not.exist");
  });

  it("should allow creating a new thread", () => {
    // Click the new thread button
    cy.get("button").contains("add").click();

    // Type a thread name
    cy.get("input#name").type("New_Thread");

    // Click the Create button
    cy.contains("Create").click();

    // Check that validateThreadName was called with the correct name
    cy.get("@validateThreadName").should("have.been.calledWith", "New_Thread");

    // Check that saveConversationThreads was called
    cy.get("@saveConversationThreads").should("have.been.called");
  });

  it("should show an error when thread creation fails", () => {
    // Make validateThreadName return false
    mockValidateThreadName.returns(false);

    // Click the new thread button
    cy.get("button").contains("add").click();

    // Type an invalid thread name
    cy.get("input#name").type("Invalid Thread Name");

    // Click the Create button
    cy.contains("Create").click();

    // Check that an error message is displayed
    cy.contains("Invalid thread name").should("exist");
  });

  it("should handle loading state", () => {
    // Create a store with loading state
    const loadingStore = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
      preloadedState: {
        character: {
          characters: [
            {
              id: "lexiblake",
              name: "Lexi Blake",
              filePath: "lexiblake",
            },
          ],
          selectedCharacterId: "lexiblake",
          lifeEvents: [],
          currentViewDate: null,
          availableDates: [],
          conversationThreads: [],
          selectedThreadId: null,
          isLoading: true,
          error: null,
        },
      },
    });

    // Remount with loading state
    cy.mount(
      <Provider store={loadingStore}>
        <ChatInterface characterName="Lexi Blake" />
      </Provider>
    );

    // Check that loading indicators are displayed
    cy.get(".MuiCircularProgress-root").should("exist");

    // Check that the message input is disabled
    cy.get("input[placeholder='Type a message...']").should("be.disabled");
  });
});
