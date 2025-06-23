import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    specPattern: "components/*.spec.ts",
    supportFile: false,
    baseUrl: "http://localhost:4052",
  },
});
