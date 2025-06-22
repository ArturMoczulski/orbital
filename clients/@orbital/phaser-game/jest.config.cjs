/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require("path");

module.exports = {
  testEnvironment: "jest-environment-jsdom",
  clearMocks: true,
  resetMocks: true,
  roots: [
    "<rootDir>",
    path.resolve(__dirname, "../../../libs/@orbital/phaser-ui/src"),
  ],
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.(ts|tsx|js)$": [
      path.resolve(__dirname, "../../../node_modules/ts-jest"),
      {
        tsconfig: path.join(__dirname, "tsconfig.json"),
      },
    ],
  },
  // Mock HTMLCanvasElement for Phaser using jest-canvas-mock
  setupFiles: [
    path.resolve(__dirname, "../../../node_modules/jest-canvas-mock"),
    "<rootDir>/jest.setup.js",
  ],
  setupFilesAfterEnv: [],
  resetModules: true,
  transformIgnorePatterns: ["node_modules/(?!(\\@orbital\\/phaser-ui)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleDirectories: [
    "node_modules",
    path.resolve(__dirname, "../../../libs/@orbital/phaser-ui/src"),
  ],
  moduleNameMapper: {
    // Mock styles and asset imports
    "\\.(css|less|sass|scss)$": "<rootDir>/test/mocks/styleMock.js",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/fileMock.js",
    // Mock Phaser to avoid WebGL and Canvas issues
    "^phaser$": "<rootDir>/../shared/phaser-extended-mocks/src/index.js",
    // Mock missing phaser3spectorjs dependency
    phaser3spectorjs: "<rootDir>/test/mocks/styleMock.js",
    // Mock rexui plugin to avoid Phaser undefined errors
    "^phaser3-rex-plugins/dist/rexuiplugin\\.js$":
      "<rootDir>/test/mocks/pluginMock.js",
    "^phaser3-rex-plugins/templates/ui/ui-plugin\\.js$":
      "<rootDir>/test/mocks/pluginMock.js",
    "^phaser3-rex-plugins/templates/ui/ui-plugin\\.js$":
      "<rootDir>/test/mocks/pluginMock.js",
    "^@orbital/phaser-ui$": "<rootDir>/test/mocks/phaserUiMock.js",
    "^@orbital/phaser-ui/(.*)$": "<rootDir>/test/mocks/phaserUiMock.js",
    // Mock ClientSettingsPopup to avoid dependency issues
    "^game/ui/organisms/ClientSettingsPopup$":
      "<rootDir>/test/mocks/clientSettingsPopupMock.js",
  },
};
