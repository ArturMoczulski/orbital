/** Main Jest configuration */
const { name: pkg } = require("./package.json");

module.exports = {
  projects: [
    "<rootDir>/jest.unit.config.js",
    "<rootDir>/jest.integration.config.js",
  ],
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.d\\.ts$",
    "index.ts",
  ],
  coverageDirectory: "coverage",
  displayName: pkg,
};
