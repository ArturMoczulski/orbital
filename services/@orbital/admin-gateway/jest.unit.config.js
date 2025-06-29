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
  testPathIgnorePatterns: [
    ...(base.testPathIgnorePatterns || []),
    "/node_modules/",
    "/dist/",
    ".*integration\\.spec\\.ts$",
    ".*e2e\\.spec\\.ts$",
  ],
};
