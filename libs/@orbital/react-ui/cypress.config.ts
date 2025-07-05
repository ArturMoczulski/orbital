import { defineConfig } from "cypress";
import path from "path";

// Log the absolute path to help debug
const componentsDir = path.resolve(__dirname, "src/components");
console.log("Components directory:", componentsDir);

// Check if the spec files exist
const fs = require("fs");
if (fs.existsSync(path.join(componentsDir, "TreeExplorer.spec.tsx"))) {
  console.log("TreeExplorer.spec.tsx exists");
} else {
  console.log("TreeExplorer.spec.tsx does not exist");
}

if (fs.existsSync(path.join(componentsDir, "TreeExplorer.cy.tsx"))) {
  console.log("TreeExplorer.cy.tsx exists");
} else {
  console.log("TreeExplorer.cy.tsx does not exist");
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
