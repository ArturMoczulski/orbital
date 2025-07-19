/** Jest configuration for unit tests */
const base = require("./jest.config");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:unit`,
  setupFilesAfterEnv: [
    ...(base.setupFilesAfterEnv || []),
    "<rootDir>/../jest.setup.unit.js",
  ],
  testMatch: ["**/*.spec.ts"],
  testPathIgnorePatterns: [
    ...(base.testPathIgnorePatterns || []),
    ".*integration\\.spec\\.ts$",
    ".*e2e\\.spec\\.ts$",
  ],
};
