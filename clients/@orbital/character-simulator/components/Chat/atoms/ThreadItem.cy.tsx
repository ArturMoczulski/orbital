import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { ConversationThread, characterSlice } from "../../../store";
import ThreadItem from "./ThreadItem";

// Mock conversation thread
const mockThread: ConversationThread = {
  id: "thread1",
  name: "Test Thread",
  messages: [
    {
      id: "msg1",
      content: "This is a test message",
      sender: "user" as const,
      timestamp: "2025-07-19T12:00:00Z",
    },
  ],
  createdAt: "2025-07-19T10:00:00Z",
  updatedAt: "2025-07-19T12:00:00Z",
};

describe("ThreadItem Component", () => {
  beforeEach(() => {
    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });

    // Mount the component
    cy.mount(
      <Provider store={store}>
        <ThreadItem thread={mockThread} isSelected={false} onClick={() => {}} />
      </Provider>
    );
  });

  it("should display the thread name", () => {
    cy.contains("Test Thread").should("exist");
  });

  it("should display the last message preview", () => {
    cy.contains("This is a test message").should("exist");
  });

  it("should display the formatted date", () => {
    // The date format will depend on the user's locale, but we can check for parts of it
    const date = new Date("2025-07-19T12:00:00Z");
    const month = date.toLocaleDateString(undefined, { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();

    cy.contains(month).should("exist");
    cy.contains(day.toString()).should("exist");
    cy.contains(year.toString()).should("exist");
  });

  it("should apply selected styles when isSelected is true", () => {
    // Remount with isSelected=true
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadItem thread={mockThread} isSelected={true} onClick={() => {}} />
      </Provider>
    );

    // Check that the selected styles are applied
    cy.get(".MuiListItemButton-root.Mui-selected").should("exist");
    cy.contains("Test Thread").should("have.css", "font-weight", "700"); // Bold text
  });

  it("should call onClick when clicked", () => {
    const onClickSpy = cy.spy().as("onClickSpy");

    // Remount with the spy
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadItem
          thread={mockThread}
          isSelected={false}
          onClick={onClickSpy}
        />
      </Provider>
    );

    // Click the thread item
    cy.get(".MuiListItemButton-root").click();

    // Verify the onClick handler was called
    cy.get("@onClickSpy").should("have.been.called");
  });

  it("should truncate long message previews", () => {
    // Create a thread with a long message
    const longMessageThread: ConversationThread = {
      ...mockThread,
      messages: [
        {
          id: "msg1",
          content:
            "This is a very long message that should be truncated in the preview because it exceeds the maximum length allowed for previews in the ThreadItem component",
          sender: "user" as const,
          timestamp: "2025-07-19T12:00:00Z",
        },
      ],
    };

    // Remount with the long message thread
    cy.mount(
      <Provider
        store={configureStore({
          reducer: { character: characterSlice.reducer },
        })}
      >
        <ThreadItem
          thread={longMessageThread}
          isSelected={false}
          onClick={() => {}}
        />
      </Provider>
    );

    // Check that the message is truncated
    cy.contains("This is a very long message that").should("exist");
    cy.contains("...").should("exist");
  });
});
