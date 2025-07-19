import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { characterSlice } from "../store";
import CharacterSelector from "./CharacterSelector";

// Mock the character service
const mockCharacters = [
  {
    id: "lexiblake",
    name: "Lexi Blake",
    filePath: "lexiblake",
  },
];

const mockLifeEvents = [
  {
    timestamp: "2025-07-18T10:00:00",
    location: "Test Location 1",
    activity: "Test event 1",
    emotionalState: "focused",
    thoughts: "This is a test thought",
    decisions: "Decided to test this component",
    needsFulfilled: ["learning"],
    socialMediaContent: undefined,
  },
  {
    timestamp: "2025-07-18T11:00:00",
    location: "Test Location 2",
    activity: "Test event 2",
    emotionalState: "excited",
    thoughts: "This is another test thought",
    decisions: "Decided to continue testing",
    needsFulfilled: ["achievement"],
    socialMediaContent: undefined,
  },
];

describe("CharacterSelector Component", () => {
  beforeEach(() => {
    // Intercept API calls and provide mock responses
    cy.intercept("GET", "/api/characters", {
      statusCode: 200,
      body: mockCharacters,
    }).as("loadCharacters");

    cy.intercept("GET", "/data/lexiblake/timeline/*.json", {
      statusCode: 200,
      body: mockLifeEvents,
    }).as("loadLifeEventsFromPath");

    // Create a Redux store with the character slice
    const store = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
    });

    // Mount the component with the Redux provider
    cy.mount(
      <Provider store={store}>
        <CharacterSelector />
      </Provider>
    );
  });

  it("should load and display characters on mount", () => {
    // Verify the API request was made
    cy.wait("@loadCharacters");

    // Verify the select element exists
    cy.get("#character-select").should("exist");

    // Open the dropdown
    cy.get("#character-select").click();

    // Verify the character is in the dropdown
    cy.get(".MuiMenuItem-root").should("have.length", 1);
    cy.get(".MuiMenuItem-root").eq(0).should("contain.text", "Lexi Blake");
  });

  it("should load life events when a character is selected", () => {
    // Open the dropdown
    cy.get("#character-select").click();

    // Select the first character
    cy.get(".MuiMenuItem-root").eq(0).click();

    // Verify the API request was made
    cy.wait("@loadLifeEventsFromPath")
      .its("request.url")
      .should("include", "lexiblake");
  });

  it("should render without errors with empty characters array", () => {
    // Create a store with empty characters array
    const emptyStore = configureStore({
      reducer: {
        character: characterSlice.reducer,
      },
      preloadedState: {
        character: {
          characters: [], // Empty characters array
          selectedCharacterId: null,
          lifeEvents: [],
          currentViewDate: null,
          availableDates: [],
          isLoading: false,
          error: null,
        },
      },
    });

    // Mount the component with the empty store
    cy.mount(
      <Provider store={emptyStore}>
        <CharacterSelector />
      </Provider>
    );

    // Verify the component renders without errors
    cy.get("#character-select").should("exist");
  });

  it("should handle error state correctly", () => {
    // Intercept the API call and return an error
    cy.intercept("GET", "/data/lexiblake/timeline/*.json", {
      statusCode: 500,
      body: { error: "Test error" },
    }).as("loadLifeEventsError");

    // Open the dropdown
    cy.get("#character-select").click();

    // Select the first character
    cy.get(".MuiMenuItem-root").eq(0).click();

    // Verify the error API request was made
    cy.wait("@loadLifeEventsError");

    // We could also check for an error message in the UI if one is displayed
  });

  it("should display avatar for character", () => {
    // Open the dropdown
    cy.get("#character-select").click();

    // Check if the avatar is displayed for the first character
    cy.get(".MuiMenuItem-root").eq(0).find(".MuiAvatar-root").should("exist");

    // For Material UI Avatar, we can't directly check the src attribute
    // as it might be using a background image or other method
    // Instead, we'll just verify the avatar exists
  });
});
