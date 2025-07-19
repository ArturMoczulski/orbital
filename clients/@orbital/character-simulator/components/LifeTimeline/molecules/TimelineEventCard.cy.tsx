import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import TimelineEventCard from "./TimelineEventCard";

// Create a theme for the component
const theme = createTheme();

// Mock event data
const mockEvent = {
  timestamp: "2023-01-01T10:00:00Z",
  activity: "Test event description",
  location: "Test Location",
  emotionalState: "happy, excited",
  thoughts: "This is a test thought. Another test thought.",
  decisions: "Decided to test this component",
  needsFulfilled: ["learning", "growth"],
  socialMediaContent: undefined,
};

const mockSocialMediaEvent = {
  timestamp: "2023-01-01T14:00:00Z",
  activity: "Test social media event",
  location: "Social Media Platform",
  emotionalState: "happy, excited",
  thoughts: "This is a test thought for social media",
  decisions: "Decided to post on social media",
  needsFulfilled: ["connection", "expression"],
  socialMediaContent: {
    postType: "feed",
    promptImage: "Image of the test event",
    caption: "This is a test social media post #testing #cypress",
  },
};

describe("TimelineEventCard Component", () => {
  it("renders correctly with basic event data", () => {
    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <TimelineEventCard event={mockEvent} />
      </ThemeProvider>
    );

    // Check if the component renders the basic event information
    cy.contains("Test event description").should("be.visible");
    cy.contains("Activity").should("be.visible");
  });

  it("renders emotional states correctly", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineEventCard event={mockEvent} />
      </ThemeProvider>
    );

    // Check if emotional states are rendered
    cy.contains("Feeling:").should("be.visible");
    cy.contains("happy").should("be.visible");
    cy.contains("excited").should("be.visible");
  });

  it("renders thoughts correctly", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineEventCard event={mockEvent} />
      </ThemeProvider>
    );

    // Check if thoughts are rendered
    cy.contains("Thoughts:").should("be.visible");
    cy.contains("This is a test thought. Another test thought.").should(
      "be.visible"
    );
  });

  it("renders social media indicator when event is a social media post", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineEventCard event={mockSocialMediaEvent} />
      </ThemeProvider>
    );

    // Check if social media indicator is rendered
    cy.contains("Social Media").should("be.visible");
  });

  it("does not render social media indicator when showSocialMedia is false", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineEventCard
          event={mockSocialMediaEvent}
          showSocialMedia={false}
        />
      </ThemeProvider>
    );

    // Check that social media indicator is not rendered
    cy.contains("Social Media").should("not.exist");
  });

  it("handles events without optional fields", () => {
    const minimalEvent = {
      timestamp: "2023-01-01T10:00:00Z",
      activity: "Minimal event",
      location: "",
      emotionalState: "",
      thoughts: "",
      decisions: "",
      needsFulfilled: [],
    };

    mount(
      <ThemeProvider theme={theme}>
        <TimelineEventCard event={minimalEvent} />
      </ThemeProvider>
    );

    // Check that the component renders without errors
    cy.contains("Minimal event").should("be.visible");
    cy.contains("Activity").should("be.visible");

    // Check that optional fields are not rendered
    cy.contains("Thoughts:").should("not.exist");
    cy.contains("Feeling:").should("not.exist");
  });
});
