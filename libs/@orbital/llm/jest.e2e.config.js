/** Jest configuration for end-to-end tests */
const base = require("./jest.config.base");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:e2e`,
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "<rootDir>/jest.setup.e2e.js",
  ],
  testMatch: ["**/*.e2e.spec.ts"],
};
