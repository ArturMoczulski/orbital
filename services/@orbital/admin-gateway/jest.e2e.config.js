/** Jest configuration for end-to-end tests */
const base = require("./jest.config");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: `${pkg}:e2e`,
  setupFilesAfterEnv: [
    ...(base.setupFilesAfterEnv || []),
    "<rootDir>/../jest.setup.e2e.js",
  ],
  testMatch: ["**/*.e2e.spec.ts"],
  forceExit: true,
};
