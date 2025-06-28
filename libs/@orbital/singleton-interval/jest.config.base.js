/** Base Jest configuration */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        babelConfig: true, // Use babel.config.js
      },
    ],
  },
  // Make sure @scout/core is transformed by ts-jest
  transformIgnorePatterns: ["/node_modules/(?!(@scout/core)/)"],
  // Map @scout/core imports to the actual source files
  moduleNameMapper: {
    "^@scout/core/(.*)$": "<rootDir>/../@scout/core/$1",
  },
};
