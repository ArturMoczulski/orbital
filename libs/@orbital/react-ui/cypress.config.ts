import { defineConfig } from "cypress";
import path from "path";

// Log the absolute path to help debug
const componentsDir = path.resolve(__dirname, "src/components");
console.log("Components directory:", componentsDir);

// Check if the spec files exist
const fs = require("fs");
if (fs.existsSync(path.join(componentsDir, "ObjectExplorer.spec.tsx"))) {
  console.log("ObjectExplorer.spec.tsx exists");
} else {
  console.log("ObjectExplorer.spec.tsx does not exist");
}

if (fs.existsSync(path.join(componentsDir, "ObjectExplorer.cy.tsx"))) {
  console.log("ObjectExplorer.cy.tsx exists");
} else {
  console.log("ObjectExplorer.cy.tsx does not exist");
}

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: require("./webpack.config.js"),
    },
    specPattern: [
      "src/components/**/*.cy.{ts,tsx}",
      "cypress/interactables/**/*.cy.{ts,tsx}",
    ],
    supportFile: "cypress/support/component.ts",
  },
  e2e: {
    specPattern: [
      "src/components/**/*.cy.{ts,tsx}",
      "cypress/interactables/**/*.cy.{ts,tsx}",
    ],
    supportFile: "cypress/support/component.ts",
  },
});
