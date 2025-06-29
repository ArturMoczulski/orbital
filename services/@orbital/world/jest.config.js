/**
 * Base Jest configuration for all test types
 * This serves as the shared configuration for unit, integration, and e2e tests
 */
const path = require("path");
const { name: pkg } = require("./package.json");
const dotenv = require("dotenv");

// Load test environment variables for all test types
dotenv.config({ path: path.join(__dirname, ".env.test") });

module.exports = {
  // Common setup
  setupFiles: [
    path.resolve(__dirname, "../../../node_modules/reflect-metadata"),
  ],

  // Common file extensions and environment
  moduleFileExtensions: ["js", "json", "ts"],
  testEnvironment: "node",

  // Common paths
  rootDir: "src",

  // Common transform configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      path.resolve(__dirname, "../../../node_modules/ts-jest"),
      {
        tsconfig: path.join(__dirname, "tsconfig.json"),
      },
    ],
  },

  // Common patterns
  transformIgnorePatterns: ["^.+\\.js$"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",

  // Common setup files
  setupFilesAfterEnv: ["<rootDir>/../jest.setup.js"],

  // Verbose output for better debugging
  verbose: true,

  // Default timeout for tests
  testTimeout: 2000,
};
