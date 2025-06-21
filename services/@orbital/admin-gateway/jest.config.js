module.exports = {
  setupFiles: ["reflect-metadata"],
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: "\\.spec\\.ts$",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  transformIgnorePatterns: ["^.+\\.js$"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
