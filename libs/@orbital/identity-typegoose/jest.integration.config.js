/**
 * Jest configuration for integration tests
 * Extends the base configuration with integration-test-specific settings
 */
const baseConfig = require("./jest.config");
const path = require("path");

module.exports = {
  ...baseConfig,
  // Integration test specific patterns
  testRegex: ".*\\.integration\\.spec\\.ts$",

  // Additional setup files for integration tests
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    path.resolve(__dirname, "jest.setup.integration.js"),
  ],

  // Integration test specific coverage settings
  coverageDirectory: "../coverage/integration",

  // Collect coverage from integration tests
  collectCoverage: true,

  // Integration tests may take longer due to database operations
  testTimeout: 60000,
};
