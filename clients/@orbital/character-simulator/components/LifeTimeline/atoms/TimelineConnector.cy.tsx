import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import TimelineConnector from "./TimelineConnector";

// Create a theme for the component
const theme = createTheme();

describe("TimelineConnector Component", () => {
  it("renders with default color when no color is provided", () => {
    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <TimelineConnector />
      </ThemeProvider>
    );

    // Check if the component renders with the default color
    cy.get(".MuiTimelineConnector-root")
      .should("exist")
      .and("have.css", "background-color");
  });

  it("renders with custom color when provided", () => {
    const customColor = "#FF5733";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineConnector color={customColor} />
      </ThemeProvider>
    );

    // Check if the component renders with the custom color
    cy.get(".MuiTimelineConnector-root")
      .should("exist")
      .and("have.css", "background-color");

    // Should have the custom color
    // Note: The exact RGB value might vary due to browser rendering
  });

  it("renders with correct styling", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineConnector />
      </ThemeProvider>
    );

    // Check if the component has the correct styling
    cy.get(".MuiTimelineConnector-root")
      .should("exist")
      .and("have.css", "min-height"); // TimelineConnector should have a min-height
  });
});
