/**
 * Jest configuration specifically for VS Code Jest extension
 */
const path = require("path");

module.exports = {
  // Common setup
  setupFiles: [path.resolve(__dirname, "node_modules/reflect-metadata")],

  // Common file extensions and environment
  moduleFileExtensions: ["js", "json", "ts"],
  testEnvironment: "node",

  // Module name mapper for imports
  moduleNameMapper: {
    "^@orbital/core$": "<rootDir>/libs/@orbital/core/src",
    "^@orbital/core/(.*)$": "<rootDir>/libs/@orbital/core/src/$1",
    "^@orbital/typegoose$": "<rootDir>/libs/@orbital/typegoose/src",
    "^@orbital/typegoose/(.*)$": "<rootDir>/libs/@orbital/typegoose/src/$1",
    "^@orbital/microservices$": "<rootDir>/libs/@orbital/microservices/src",
    "^@orbital/microservices/(.*)$":
      "<rootDir>/libs/@orbital/microservices/src/$1",
    "^@orbital/bulk-operations$": "<rootDir>/libs/@orbital/bulk-operations/src",
    "^@orbital/bulk-operations/(.*)$":
      "<rootDir>/libs/@orbital/bulk-operations/src/$1",
    "^@orbital/contracts$": "<rootDir>/libs/@orbital/contracts/src",
    "^@orbital/contracts/(.*)$": "<rootDir>/libs/@orbital/contracts/src/$1",
  },

  // Transform configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      path.resolve(__dirname, "node_modules/ts-jest"),
      {
        tsconfig: path.join(__dirname, "services/@orbital/world/tsconfig.json"),
        isolatedModules: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    ],
  },

  // Common patterns
  transformIgnorePatterns: ["^.+\\.js$"],
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/templates/", "/dist/"],

  // Verbose output for better debugging
  verbose: true,

  // Default timeout for tests
  testTimeout: 60000,

  // Root directory
  rootDir: __dirname,

  // Projects configuration for monorepo
  projects: [
    {
      displayName: "world",
      testMatch: ["<rootDir>/services/@orbital/world/**/*.spec.ts"],
      rootDir: __dirname,
      transform: {
        "^.+\\.(ts|tsx)$": [
          path.resolve(__dirname, "node_modules/ts-jest"),
          {
            tsconfig: path.join(
              __dirname,
              "services/@orbital/world/tsconfig.json"
            ),
            isolatedModules: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
          },
        ],
      },
    },
  ],
};
