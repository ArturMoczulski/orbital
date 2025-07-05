import { defineConfig } from "cypress";
import path from "path";

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      // Use Next.js webpack config
      webpackConfig: {
        resolve: {
          extensions: [".ts", ".tsx", ".js", ".jsx"],
          alias: {
            "@orbital/core": path.resolve(
              __dirname,
              "../../libs/@orbital/core"
            ),
            "@orbital/react-ui": path.resolve(
              __dirname,
              "../../libs/@orbital/react-ui"
            ),
          },
        },
      },
    },
    // Use absolute paths for spec files
    specPattern: ["components/**/*.cy.{ts,tsx}"],
    supportFile: path.join(__dirname, "cypress/support/component.ts"),
  },

  e2e: {
    specPattern: ["pages/**/*.cy.ts", "cypress/e2e/**/*.cy.ts"],
    supportFile: "cypress/commands/index.ts",
    baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:4052",
  },
});
