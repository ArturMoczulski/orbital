import SocialMediaIcon from "@mui/icons-material/Share";
import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import TimelineChip from "./TimelineChip";

// Create a theme for the component
const theme = createTheme();

describe("TimelineChip Component", () => {
  it("renders correctly with label only", () => {
    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <TimelineChip label="Test Label" />
      </ThemeProvider>
    );

    // Check if the component renders the label
    cy.contains("Test Label").should("be.visible");
  });

  it("renders with custom background color", () => {
    const color = "#FF5733";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineChip label="Colored Chip" color={color} />
      </ThemeProvider>
    );

    // Check if the component renders with the custom background color
    cy.contains("Colored Chip")
      .parent()
      .should("have.css", "background-color")
      .and("include", "rgb(255, 87, 51)"); // Approximate RGB equivalent of #FF5733
  });

  it("renders with custom text color", () => {
    const textColor = "#33FF57";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineChip label="Custom Text Color" textColor={textColor} />
      </ThemeProvider>
    );

    // Check if the component renders with the custom text color
    cy.contains("Custom Text Color")
      .should("have.css", "color")
      .and("include", "rgb(51, 255, 87)"); // Approximate RGB equivalent of #33FF57
  });

  it("renders with an icon", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineChip
          label="With Icon"
          icon={<SocialMediaIcon data-testid="social-icon" />}
        />
      </ThemeProvider>
    );

    // Check if the component renders the label and the icon
    cy.contains("With Icon").should("be.visible");
    cy.get("[data-testid=social-icon]").should("exist");
  });

  it("passes through other MUI Chip props", () => {
    mount(
      <ThemeProvider theme={theme}>
        <TimelineChip
          label="Clickable Chip"
          onClick={cy.stub().as("clickHandler")}
          data-testid="clickable-chip"
        />
      </ThemeProvider>
    );

    // Check if the component is clickable
    cy.get("[data-testid=clickable-chip]").click();
    cy.get("@clickHandler").should("have.been.called");
  });
});
