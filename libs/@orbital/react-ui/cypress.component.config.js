const { defineConfig } = require("cypress");
const path = require("path");
const fs = require("fs");

// Log the absolute path to help debug
const componentsDir = path.resolve(__dirname, "src/components");

// List all files in the components directory
console.log("Files in components directory:");
fs.readdirSync(componentsDir).forEach((file) => {
  console.log(" - " + file);
});

module.exports = defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: require("./webpack.config.js"),
    },
    // Use absolute paths for spec files
    specPattern: [
      "src/components/**/*.cy.{ts,tsx}",
      "cypress/interactables/**/*.cy.{ts,tsx}",
    ],
    supportFile: path.join(__dirname, "cypress/support/component.ts"),
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
