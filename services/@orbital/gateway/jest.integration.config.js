/** Jest configuration for integration tests */
const base = require("./jest.config");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:integration`,
  setupFilesAfterEnv: [
    ...(base.setupFilesAfterEnv || []),
    "<rootDir>/../jest.setup.integration.js",
  ],
  testRegex: ".*\\.integration\\.spec\\.ts$",
};
