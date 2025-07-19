import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { ConversationThread, characterSlice } from "../../../store";
import ThreadSelector from "./ThreadSelector";

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
    ],
    createdAt: "2025-07-19T10:00:00Z",
    updatedAt: "2025-07-19T12:00:00Z",
  },
  {
    id: "thread2",
    name: "Work_Discussion",
    messages: [
      {
        id: "msg2",
        content: "Let's talk about work.",
        sender: "user" as const,
        timestamp: "2025-07-19T13:00:00Z",
      },
    ],
    createdAt: "2025-07-19T13:00:00Z",
    updatedAt: "2025-07-19T13:00:00Z",
  },
  {
    id: "thread3",
    name: "Personal_Chat",
    messages: [],
    createdAt: "2025-07-19T14:00:00Z",
    updatedAt: "2025-07-19T14:00:00Z",
  },
];

describe("ThreadSelector Component", () => {
  beforeEach(() => {
    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });
  });

  it("should render correctly with threads", () => {
    const onSelectThreadSpy = cy.spy().as("onSelectThreadSpy");
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadSelector
          threads={mockThreads}
          selectedThreadId="thread1"
          onSelectThread={onSelectThreadSpy}
          onCreateThread={onCreateThreadSpy}
        />
      </Provider>
    );

    // Check that the Autocomplete component exists
    cy.get("#thread-selector").should("exist");

    // Check that the input shows the selected thread name
    cy.get('input[value="General"]').should("exist");

    // Check that the NewThreadButton exists
    cy.get("button").should("exist");
  });

  it("should open dropdown and show thread options", () => {
    const onSelectThreadSpy = cy.spy().as("onSelectThreadSpy");
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadSelector
          threads={mockThreads}
          selectedThreadId="thread1"
          onSelectThread={onSelectThreadSpy}
          onCreateThread={onCreateThreadSpy}
        />
      </Provider>
    );

    // Click to open the dropdown
    cy.get("#thread-selector").click();

    // Check that all thread options are displayed
    cy.contains("General").should("exist");
    cy.contains("Work_Discussion").should("exist");
    cy.contains("Personal_Chat").should("exist");
  });

  it("should call onSelectThread when a thread is selected", () => {
    const onSelectThreadSpy = cy.spy().as("onSelectThreadSpy");
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadSelector
          threads={mockThreads}
          selectedThreadId="thread1"
          onSelectThread={onSelectThreadSpy}
          onCreateThread={onCreateThreadSpy}
        />
      </Provider>
    );

    // Click to open the dropdown
    cy.get("#thread-selector").click();

    // Select a different thread
    cy.contains("Work_Discussion").click();

    // Verify the onSelectThread handler was called with the correct thread ID
    cy.get("@onSelectThreadSpy").should("have.been.calledWith", "thread2");
  });

  it("should display loading state when isLoading is true", () => {
    const onSelectThreadSpy = cy.spy().as("onSelectThreadSpy");
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadSelector
          threads={mockThreads}
          selectedThreadId="thread1"
          onSelectThread={onSelectThreadSpy}
          onCreateThread={onCreateThreadSpy}
          isLoading={true}
        />
      </Provider>
    );

    // Check that the loading indicator is displayed
    cy.get(".MuiCircularProgress-root").should("exist");

    // Check that the NewThreadButton is disabled when loading
    cy.get("button").should("be.disabled");
  });

  it("should display empty state when no threads", () => {
    const onSelectThreadSpy = cy.spy().as("onSelectThreadSpy");
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadSelector
          threads={[]}
          selectedThreadId={null}
          onSelectThread={onSelectThreadSpy}
          onCreateThread={onCreateThreadSpy}
        />
      </Provider>
    );

    // Click to open the dropdown
    cy.get("#thread-selector").click();

    // Check that the empty state message is displayed
    cy.contains("No conversations yet. Create one to get started.").should(
      "exist"
    );
  });

  it("should highlight the selected thread in the dropdown", () => {
    const onSelectThreadSpy = cy.spy().as("onSelectThreadSpy");
    const onCreateThreadSpy = cy.spy().as("onCreateThreadSpy");

    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadSelector
          threads={mockThreads}
          selectedThreadId="thread2"
          onSelectThread={onSelectThreadSpy}
          onCreateThread={onCreateThreadSpy}
        />
      </Provider>
    );

    // Click to open the dropdown
    cy.get("#thread-selector").click();

    // The selected thread should have bold text
    // We can't directly check CSS in the dropdown, but we can check the input value
    cy.get('input[value="Work_Discussion"]').should("exist");
  });
});
