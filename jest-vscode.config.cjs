/**
 * Jest configuration specifically for VS Code Jest extension
 */
const path = require("path");
const fs = require("fs");

// Helper function to get all package names from a directory
function getPackageNames(baseDir) {
  try {
    // Check if the directory exists
    const orbitalPath = path.join(__dirname, baseDir, "@orbital");
    if (!fs.existsSync(orbitalPath)) {
      return [];
    }

    // Get all directories inside the @orbital directory
    return fs
      .readdirSync(orbitalPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch (error) {
    console.error(`Error reading packages from ${baseDir}:`, error);
    return [];
  }
}

// Get all service and library package names
const servicePackages = getPackageNames("services");
const libPackages = getPackageNames("libs");

// Generate module name mappers for all packages
const moduleNameMapper = {};
libPackages.forEach((pkg) => {
  moduleNameMapper[`^@orbital/${pkg}$`] = `<rootDir>/libs/@orbital/${pkg}/src`;
  moduleNameMapper[`^@orbital/${pkg}/(.*)$`] =
    `<rootDir>/libs/@orbital/${pkg}/src/$1`;
});

// Generate project configurations for all packages
const projects = [];

// Add service projects
servicePackages.forEach((pkg) => {
  const tsConfigPath = path.join(
    __dirname,
    `services/@orbital/${pkg}/tsconfig.json`
  );
  // Only add if tsconfig.json exists
  if (fs.existsSync(tsConfigPath)) {
    projects.push({
      displayName: pkg,
      testMatch: [`<rootDir>/services/@orbital/${pkg}/**/*.spec.ts`],
      rootDir: __dirname,
      transform: {
        "^.+\\.(ts|tsx)$": [
          path.resolve(__dirname, "node_modules/ts-jest"),
          {
            tsconfig: tsConfigPath,
            isolatedModules: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
          },
        ],
      },
    });
  }
});

// Add library projects
libPackages.forEach((pkg) => {
  const tsConfigPath = path.join(
    __dirname,
    `libs/@orbital/${pkg}/tsconfig.json`
  );
  // Only add if tsconfig.json exists
  if (fs.existsSync(tsConfigPath)) {
    const project = {
      displayName: pkg,
      testMatch: [`<rootDir>/libs/@orbital/${pkg}/**/*.spec.ts`],
      rootDir: __dirname,
      transform: {
        "^.+\\.(ts|tsx)$": [
          path.resolve(__dirname, "node_modules/ts-jest"),
          {
            tsconfig: tsConfigPath,
            isolatedModules: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
          },
        ],
      },
    };

    // Add special setup for typegoose
    if (pkg === "typegoose") {
      project.setupFilesAfterEnv = [
        path.resolve(__dirname, "libs/@orbital/typegoose/jest.setup.js"),
        path.resolve(
          __dirname,
          "libs/@orbital/typegoose/jest.setup.integration.js"
        ),
      ];
    }

    projects.push(project);
  }
});

module.exports = {
  // Common setup
  setupFiles: [path.resolve(__dirname, "node_modules/reflect-metadata")],

  // Common file extensions and environment
  moduleFileExtensions: ["js", "json", "ts"],
  testEnvironment: "node",

  // Module name mapper for imports
  moduleNameMapper,

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
  projects,
};
