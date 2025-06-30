/** Jest configuration for end-to-end tests */
const base = require("./jest.config");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:e2e`,
  rootDir: ".",
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "<rootDir>/jest.setup.e2e.js",
  ],
  testMatch: ["**/src/**/*.e2e.spec.ts"],
};
