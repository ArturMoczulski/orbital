import { ThemeProvider, createTheme } from "@mui/material";
import { mount } from "cypress/react18";
import moment from "moment";
import TimelineDate from "./TimelineDate";

// Create a theme for the component
const theme = createTheme();

describe("TimelineDate Component", () => {
  it("renders date in default format", () => {
    const date = "2023-01-15T14:30:00Z";

    // Mount the component with the theme provider
    mount(
      <ThemeProvider theme={theme}>
        <TimelineDate date={date} />
      </ThemeProvider>
    );

    // Check if the component renders the date in the default format (MMMM D, YYYY)
    const formattedDate = moment.utc(date).format("MMMM D, YYYY");
    cy.contains(formattedDate).should("be.visible");
  });

  it("renders date in custom format", () => {
    const date = "2023-01-15T14:30:00Z";
    const format = "h:mm A";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineDate date={date} format={format} />
      </ThemeProvider>
    );

    // Check if the component renders the date in the custom format
    const formattedDate = moment(date).format(format);
    cy.contains(formattedDate).should("be.visible");
  });

  it("handles invalid date gracefully", () => {
    const invalidDate = "not-a-date";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineDate date={invalidDate} />
      </ThemeProvider>
    );

    // Check if the component renders the original string when date is invalid
    cy.contains(invalidDate).should("be.visible");
  });

  it("renders with custom typography variant", () => {
    const date = "2023-01-15T14:30:00Z";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineDate date={date} variant="h6" />
      </ThemeProvider>
    );

    // Check if the component renders with the custom typography variant
    const formattedDate = moment.utc(date).format("MMMM D, YYYY");
    cy.contains(formattedDate).should("have.class", "MuiTypography-h6");
  });

  it("renders with custom color", () => {
    const date = "2023-01-15T14:30:00Z";

    mount(
      <ThemeProvider theme={theme}>
        <TimelineDate date={date} color="primary" />
      </ThemeProvider>
    );

    // Check if the component renders with the custom color
    const formattedDate = moment.utc(date).format("MMMM D, YYYY");
    cy.contains(formattedDate).should(
      "have.class",
      "MuiTypography-colorPrimary"
    );
  });
});
