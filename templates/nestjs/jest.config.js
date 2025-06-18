/** Jest configuration for NestJS packages */
const base = require("./jest.config.base");
const { name: pkg } = require("./package.json");

module.exports = {
  projects: [
    {
      ...base,
      displayName: `${pkg}:unit`,
      roots: ["<rootDir>/src", "<rootDir>/tests/unit"],
      setupFilesAfterEnv: ["<rootDir>/tests/unit/jest.setup.unit.js"],
      testMatch: ["**/tests/unit/**/*.spec.ts"],
    },
    {
      ...base,
      displayName: `${pkg}:integration`,
      roots: ["<rootDir>/src", "<rootDir>/tests/integration"],
      setupFilesAfterEnv: [
        "<rootDir>/tests/integration/jest.setup.integration.js",
      ],
      testMatch: ["**/tests/integration/**/*.spec.ts"],
    },
    {
      ...base,
      displayName: `${pkg}:e2e`,
      roots: ["<rootDir>/src", "<rootDir>/tests/e2e"],
      setupFilesAfterEnv: ["<rootDir>/tests/e2e/jest.setup.e2e.js"],
      testMatch: ["**/tests/e2e/**/*.spec.ts"],
    },
  ],
};