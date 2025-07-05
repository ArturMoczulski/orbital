const { defineConfig } = require("cypress");
const path = require("path");
const fs = require("fs");

// Log the absolute path to help debug
const componentsDir = path.resolve(__dirname, "src/components");

// Determine if we're running in component testing mode
const isComponentTesting = process.argv.includes("--component");

// List all files in the components directory when in component mode
if (isComponentTesting) {
  console.log("Components directory:", componentsDir);

  if (fs.existsSync(componentsDir)) {
    console.log("Files in components directory:");
    fs.readdirSync(componentsDir).forEach((file) => {
      console.log(" - " + file);
    });
  } else {
    console.log("Components directory does not exist");
  }
}

module.exports = defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: require("./webpack.config.js"),
    },
    setupNodeEvents(on, config) {
      require("cypress-terminal-report/src/installLogsPrinter")(on, {
        printLogsToConsole: "always",
      });
    },
    // Use absolute paths for spec files
    specPattern: [
      "src/components/**/*.cy.{ts,tsx}",
      "cypress/interactables/**/*.cy.{ts,tsx}",
    ],
    // Exclude Jest unit test files from compilation
    excludeSpecPattern: [
      "**/*.unit.spec.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "!**/*.cy.spec.{ts,tsx}",
    ],
    supportFile: path.join(__dirname, "cypress/support/component.ts"),
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      require("cypress-terminal-report/src/installLogsPrinter")(on, {
        printLogsToConsole: "always",
      });
    },
    specPattern: [
      "src/**/*.e2e.cy.{js,jsx,ts,tsx}",
      "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    ],
    supportFile: path.join(__dirname, "cypress/support/e2e.ts"),
  },
});
