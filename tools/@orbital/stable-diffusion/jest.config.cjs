/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/commands"],
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.(ts|js)$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "cjs"],
  modulePathIgnorePatterns: ["<rootDir>/bin/tmp-*"],
};
