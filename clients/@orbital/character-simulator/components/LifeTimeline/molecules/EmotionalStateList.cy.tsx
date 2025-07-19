import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import EmotionalStateList from "./EmotionalStateList";

// Create a theme for the component
const theme = createTheme();

describe("EmotionalStateList Component", () => {
  it("renders correctly with array of emotional states", () => {
    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <EmotionalStateList emotionalState={["happy", "excited", "grateful"]} />
      </ThemeProvider>
    );

    // Check if the component renders the label and all emotional states
    cy.contains("Feeling:").should("be.visible");
    cy.contains("happy").should("be.visible");
    cy.contains("excited").should("be.visible");
    cy.contains("grateful").should("be.visible");
  });

  it("renders correctly with a single emotional state as string", () => {
    mount(
      <ThemeProvider theme={theme}>
        <EmotionalStateList emotionalState="content" />
      </ThemeProvider>
    );

    // Check if the component renders the label and the emotional state
    cy.contains("Feeling:").should("be.visible");
    cy.contains("content").should("be.visible");
  });

  it("renders nothing when emotionalState is empty", () => {
    const emptyArray: string[] = [];

    mount(
      <ThemeProvider theme={theme}>
        <div data-testid="container">
          <EmotionalStateList emotionalState={emptyArray} />
        </div>
      </ThemeProvider>
    );

    // Check that the component doesn't render anything
    cy.contains("Feeling:").should("not.exist");
  });

  it("renders nothing when emotionalState is null or undefined", () => {
    mount(
      <ThemeProvider theme={theme}>
        <div data-testid="container">
          <EmotionalStateList emotionalState={null as any} />
        </div>
      </ThemeProvider>
    );

    // Check that the component doesn't render anything
    cy.contains("Feeling:").should("not.exist");
  });
});
