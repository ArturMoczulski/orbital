import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import ThoughtsList from "./ThoughtsList";

// Create a theme for the component
const theme = createTheme();

describe("ThoughtsList Component", () => {
  it("renders correctly with array of thoughts", () => {
    const thoughts = [
      "This is the first thought",
      "This is the second thought",
      "This is the third thought",
    ];

    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <ThoughtsList thoughts={thoughts} />
      </ThemeProvider>
    );

    // Check if the component renders the label
    cy.contains("Thoughts:").should("be.visible");

    // Check if all thoughts are rendered (joined with a space)
    cy.contains(
      "This is the first thought This is the second thought This is the third thought"
    ).should("be.visible");
  });

  it("renders correctly with a single thought as string", () => {
    const thought = "This is a single thought";

    mount(
      <ThemeProvider theme={theme}>
        <ThoughtsList thoughts={thought} />
      </ThemeProvider>
    );

    // Check if the component renders the label and the thought
    cy.contains("Thoughts:").should("be.visible");
    cy.contains("This is a single thought").should("be.visible");
  });

  it("renders nothing when thoughts is empty", () => {
    const emptyArray: string[] = [];

    mount(
      <ThemeProvider theme={theme}>
        <div data-testid="container">
          <ThoughtsList thoughts={emptyArray} />
        </div>
      </ThemeProvider>
    );

    // Check that the component doesn't render anything
    cy.contains("Thoughts:").should("not.exist");
  });

  it("renders nothing when thoughts is null or undefined", () => {
    mount(
      <ThemeProvider theme={theme}>
        <div data-testid="container">
          <ThoughtsList thoughts={null as any} />
        </div>
      </ThemeProvider>
    );

    // Check that the component doesn't render anything
    cy.contains("Thoughts:").should("not.exist");
  });
});
