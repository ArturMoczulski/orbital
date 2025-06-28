/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowJs: true,
          noImplicitAny: false,
          skipLibCheck: true,
        },
        isolatedModules: true, // This will skip type checking
      },
    ],
  },
  moduleNameMapper: {
    "^@scout/core/(.*)$": "<rootDir>/../../@scout/core/$1",
    "^@orbital/core/(.*)$": "<rootDir>/../@orbital/core/$1",
  },
  transformIgnorePatterns: ["/node_modules/(?!(@scout|@orbital)/)"],
};
