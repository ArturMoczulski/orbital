import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    specPattern: "pages/**/*.cy.ts",
    supportFile: "cypress/commands/index.ts",
    baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:4052",
  },
});
