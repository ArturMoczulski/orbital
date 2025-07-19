import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    specPattern: [
      "cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}",
      "pages/**/*.e2e.cy.{js,jsx,ts,tsx}",
    ],
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // Register cypress-terminal-report
      require("cypress-terminal-report/src/installLogsPrinter")(on);

      // Register cypress-grep
      require("@cypress/grep/src/plugin")(config);

      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
    specPattern: ["components/**/*.cy.{js,jsx,ts,tsx}"],
    supportFile: "cypress/support/component.ts",
    indexHtmlFile: "cypress/support/component-index.html",
    setupNodeEvents(on, config) {
      // Register cypress-terminal-report
      require("cypress-terminal-report/src/installLogsPrinter")(on);

      // Register cypress-grep
      require("@cypress/grep/src/plugin")(config);

      return config;
    },
  },

  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
});
