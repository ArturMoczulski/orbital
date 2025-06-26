import { defineConfig } from "cypress";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  e2e: {
    specPattern: ["pages/**/*.cy.ts", "cypress/e2e/**/*.cy.ts"],
    supportFile: "cypress/commands/index.ts",
    baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:4052",
  },
});
