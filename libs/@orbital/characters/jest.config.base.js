/** Base Jest configuration */
module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
  },
};
