/**
 * Jest configuration for unit tests
 * Extends the base configuration with unit-test-specific settings
 */
const baseConfig = require("./jest.config");
const path = require("path");

module.exports = {
  ...baseConfig,
  // Unit test specific patterns - exclude integration tests
  testRegex: "^(?!.*\\.integration\\.spec\\.ts$).*\\.spec\\.ts$",

  // Additional setup files for unit tests
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    "<rootDir>/../jest.setup.unit.js",
  ],

  // Unit test specific coverage settings
  coverageDirectory: "../coverage/unit",

  // Collect coverage from unit tests
  collectCoverage: true,

  // Unit tests typically run faster, so we can use a shorter timeout
  testTimeout: 30000,
};
