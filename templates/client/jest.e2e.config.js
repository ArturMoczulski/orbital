/** Jest configuration for end-to-end tests */
const base = require("./jest.config.base");
const { name: pkg } = require("./package.json");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.test") });

module.exports = {
  ...base,
  displayName: `${pkg}:e2e`,
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "<rootDir>/jest.setup.e2e.js",
  ],
  testMatch: ["**/*.e2e.spec.ts"],
};
