const { defineConfig } = require("cypress");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: ".env.local" });

// Log the absolute path to help debug
const componentsDir = path.resolve(__dirname, "components");

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
      // Use Next.js webpack config
      webpackConfig: {
        resolve: {
          extensions: [".ts", ".tsx", ".js", ".jsx"],
          modules: [
            "node_modules",
            path.resolve(__dirname, "../../"),
            path.resolve(__dirname, "../../libs"),
            path.resolve(__dirname, "../../libs/@orbital"),
            path.resolve(__dirname, "../../libs/@orbital/core"),
            path.resolve(__dirname, "../../libs/@orbital/react-ui"),
          ],
        },
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              use: {
                loader: "ts-loader",
                options: {
                  configFile: path.resolve(__dirname, "cypress/tsconfig.json"),
                  transpileOnly: true,
                },
              },
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ["style-loader", "css-loader"],
            },
          ],
        },
      },
    },
    // Use absolute paths for spec files
    specPattern: ["components/**/*.cy.{ts,tsx}"],
    supportFile: path.join(__dirname, "cypress/support/component.ts"),
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: ["pages/**/*.cy.ts", "cypress/e2e/**/*.cy.ts"],
    supportFile: path.join(__dirname, "cypress/support/e2e.ts"),
    baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:4052",
  },
});
