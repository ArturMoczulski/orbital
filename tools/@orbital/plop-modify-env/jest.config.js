const base = require("./jest.config.base");
const { name: pkg } = require("./package.json");

module.exports = {
  ...base,
  displayName: pkg,
  roots: ["<rootDir>/src", "<rootDir>/tests/unit"],
  setupFilesAfterEnv: ["<rootDir>/tests/unit/jest.setup.unit.js"],
  testMatch: ["**/tests/unit/**/*.spec.{ts,js}"],
};
