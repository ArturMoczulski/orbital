const path = require("path");

module.exports = {
  setupFiles: [
    path.resolve(__dirname, "../../../node_modules/reflect-metadata"),
  ],
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: "\\.spec\\.ts$",
  transform: {
    "^.+\\.(ts|tsx)$": [
      path.resolve(__dirname, "../../../node_modules/ts-jest"),
      {
        tsconfig: path.join(__dirname, "tsconfig.json"),
      },
    ],
  },
  transformIgnorePatterns: ["^.+\\.js$"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
