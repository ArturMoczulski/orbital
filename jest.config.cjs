const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.test") });
const { internalPackages } = require("./orb.json");
// Use the CommonJS export from jest.common.js
const commonConfig = require("./jest.common.cjs");

// Directories to scan for all packages
const baseDirs = ["libs", "services", "clients", "tools"];

/**
 * Build Jest project list by including every workspace package
 * except those listed in internalPackages.
 */
function getProjects() {
  const root = __dirname;
  const projects = [];

  for (const base of baseDirs) {
    const basePath = path.join(root, base);
    if (!fs.existsSync(basePath)) continue;

    for (const entry of fs.readdirSync(basePath)) {
      const entryPath = path.join(basePath, entry);

      // handle scoped packages (@scope/pkg)
      if (entry.startsWith("@") && fs.statSync(entryPath).isDirectory()) {
        for (const pkgNameDir of fs.readdirSync(entryPath)) {
          const pkgDir = path.join(entryPath, pkgNameDir);
          const pkgJson = path.join(pkgDir, "package.json");
          if (!fs.existsSync(pkgJson)) continue;
          const pkgName = require(pkgJson).name;
          if (!internalPackages.includes(pkgName)) {
            if (base === "tools") {
              projects.push(`<rootDir>/${base}/${entry}/${pkgNameDir}/src`);
            } else {
              projects.push(`<rootDir>/${base}/${entry}/${pkgNameDir}`);
            }
          }
        }
      } else {
        const pkgDir = entryPath;
        const pkgJson = path.join(pkgDir, "package.json");
        if (!fs.existsSync(pkgJson)) continue;
        const pkgName = require(pkgJson).name;
        if (!internalPackages.includes(pkgName)) {
          if (base === "tools") {
            projects.push(`<rootDir>/${base}/${entry}/src`);
          } else {
            projects.push(`<rootDir>/${base}/${entry}`);
          }
        }
      }
    }
  }

  return projects;
}

module.exports = {
  ...commonConfig,
  // CJS-specific overrides
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
  displayName: "default",
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  // Multi-project runner; disable projects via JEST_DISABLE_PROJECTS env var
  projects:
    process.env.JEST_DISABLE_PROJECTS === "true" ? undefined : getProjects(),
  transform: {
    "^.+\\.(ts|tsx)$": [
      path.resolve(__dirname, "node_modules/ts-jest"),
      {
        tsconfig: {
          esModuleInterop: true,
        },
      },
    ],
  },
  globals: {
    "ts-jest": {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
};
