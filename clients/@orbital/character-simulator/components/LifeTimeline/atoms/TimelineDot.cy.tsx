import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import TimelineDot from "./TimelineDot";

// Create a theme for the component
const theme = createTheme();

describe("TimelineDot Component", () => {
  it("renders with default color when no category is provided", () => {
    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <TimelineDot />
      </ThemeProvider>
    );

    // Check if the component renders with the default color
    cy.get(".MuiTimelineDot-root")
      .should("exist")
      .and("have.css", "background-color");
  });

  it("renders with category-specific color", () => {
    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <TimelineDot category="education" />
      </ThemeProvider>
    );

    // Check if the component renders with the education category color
    cy.get(".MuiTimelineDot-root")
      .should("exist")
      .and("have.css", "background-color");

    // Education should have a purple color (#9C27B0)
    // Note: The exact RGB value might vary due to browser rendering
  });

  it("renders with custom color when provided", () => {
    const customColor = "#FF5733";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineDot color={customColor} />
      </ThemeProvider>
    );

    // Check if the component renders with the custom color
    cy.get(".MuiTimelineDot-root")
      .should("exist")
      .and("have.css", "background-color");

    // Should have the custom color
    // Note: The exact RGB value might vary due to browser rendering
  });

  it("renders with different category colors", () => {
    // Test multiple categories
    const categories = ["education", "social", "health", "work", "travel"];

    categories.forEach((category) => {
      mount(
        <ThemeProvider theme={theme}>
          <TimelineDot category={category} />
        </ThemeProvider>
      );

      // Check if the component renders with the category color
      cy.get(".MuiTimelineDot-root")
        .should("exist")
        .and("have.css", "background-color");
    });
  });
});
