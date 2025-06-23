/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require("path");

module.exports = {
  // Mock HTMLCanvasElement for Phaser using jest-canvas-mock
  setupFiles: [
    path.resolve(__dirname, "../../../node_modules/jest-canvas-mock"),
  ],
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.(ts|tsx|js|cjs)$": [
      path.resolve(__dirname, "../../../node_modules/ts-jest"),
      {
        useESM: true,
        tsconfig: path.join(__dirname, "tsconfig.json"),
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/"],
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node", "cjs"],
  moduleNameMapper: {
    // Use existing mocks for rex UI plugin and Theme
    "^phaser3-rex-plugins/templates/ui/ui-plugin\\.js$":
      "<rootDir>/src/__mocks__/phaser3-rex-plugins/templates/ui/ui-plugin.js",
    "^phaser$": "<rootDir>/../phaser-extended-mocks/src/index.js",
  },
};
