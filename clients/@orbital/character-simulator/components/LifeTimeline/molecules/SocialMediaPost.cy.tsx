import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import SocialMediaPost from "./SocialMediaPost";

// Create a theme for the component
const theme = createTheme();

describe("SocialMediaPost Component", () => {
  it("renders correctly with required props", () => {
    const content = "This is a social media post content";
    const date = "2023-01-01T12:30:00Z";

    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <SocialMediaPost content={content} date={date} />
      </ThemeProvider>
    );

    // Check if the component renders the content and date
    cy.contains("This is a social media post content").should("be.visible");
    cy.contains("2023-01-01T12:30:00Z").should("be.visible");

    // Check if the default platform label is rendered
    cy.contains("Social Media").should("be.visible");
  });

  it("renders correctly with custom platform", () => {
    const content = "This is a Twitter post";
    const date = "2023-01-01T12:30:00Z";
    const platform = "Twitter";

    mount(
      <ThemeProvider theme={theme}>
        <SocialMediaPost content={content} date={date} platform={platform} />
      </ThemeProvider>
    );

    // Check if the component renders the content, date, and custom platform
    cy.contains("This is a Twitter post").should("be.visible");
    cy.contains("2023-01-01T12:30:00Z").should("be.visible");
    cy.contains("Twitter").should("be.visible");
  });

  it("renders with the correct styling", () => {
    const content = "This is a social media post";
    const date = "2023-01-01T12:30:00Z";

    mount(
      <ThemeProvider theme={theme}>
        <SocialMediaPost content={content} date={date} />
      </ThemeProvider>
    );

    // Check if the card has the correct styling
    cy.get(".MuiCard-root")
      .should("have.css", "border")
      .and("include", "2px solid");

    // Check if the social media icon is rendered
    cy.get("svg").should("exist");
  });

  it("renders long content correctly", () => {
    const longContent =
      "This is a very long social media post that should still be displayed correctly. " +
      "It contains multiple sentences and should be wrapped properly within the card component. " +
      "The component should handle this gracefully without any layout issues.";
    const date = "2023-01-01T12:30:00Z";

    mount(
      <ThemeProvider theme={theme}>
        <SocialMediaPost content={longContent} date={date} />
      </ThemeProvider>
    );

    // Check if the long content is rendered correctly
    cy.contains(longContent).should("be.visible");
  });
});
