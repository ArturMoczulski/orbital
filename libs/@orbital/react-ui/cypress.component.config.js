const { defineConfig } = require("cypress");
const path = require("path");
const fs = require("fs");

// Log the absolute path to help debug
const componentsDir = path.resolve(__dirname, "src/components");
console.log("Components directory:", componentsDir);

// Check if the spec files exist
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

if (
  fs.existsSync(path.join(componentsDir, "ObjectExplorer.component.spec.tsx"))
) {
  console.log("ObjectExplorer.component.spec.tsx exists");
} else {
  console.log("ObjectExplorer.component.spec.tsx does not exist");
}

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
    specPattern: [path.join(componentsDir, "*.cy.tsx")],
    supportFile: path.join(__dirname, "cypress/support/component.ts"),
  },
});
