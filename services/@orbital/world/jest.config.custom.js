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
        isolatedModules: true,
        allowJs: true,
        noImplicitAny: false,
        skipLibCheck: true,
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(@scout|@orbital)/)"],
  moduleNameMapper: {
    "^@scout/core/(.*)$": "<rootDir>/../../../libs/@scout/core/$1",
    "^@orbital/core/(.*)$": "<rootDir>/../../../libs/@orbital/core/$1",
    "^@orbital/nest/(.*)$": "<rootDir>/../../../libs/@orbital/nest/$1",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  // Add this to help with debugging
  verbose: true,
};
