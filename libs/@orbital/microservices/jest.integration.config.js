/** Jest configuration for integration tests */
const base = require("./jest.config.base");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:integration`,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/*.integration.spec.ts"],
};
