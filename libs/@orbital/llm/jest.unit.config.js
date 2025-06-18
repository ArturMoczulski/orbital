/** Jest configuration for unit tests */
const base = require("./jest.config.base");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:unit`,
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "<rootDir>/jest.setup.unit.js",
  ],
  testMatch: ["**/*.spec.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    ".*integration\\.spec\\.ts$",
    ".*e2e\\.spec\\.ts$",
  ],
};
