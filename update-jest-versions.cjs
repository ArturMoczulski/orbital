#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Target versions
const targetVersions = {
  jest: "^30.0.0",
  "ts-jest": "^29.1.0", // Latest compatible with Jest 30
  "babel-jest": "^30.0.0",
  "jest-util": "^29.7.0", // Latest compatible with Jest 30
};

// Get all package.json files in the monorepo
const findPackageJsonFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes("node_modules")) {
      findPackageJsonFiles(filePath, fileList);
    } else if (file === "package.json") {
      fileList.push(filePath);
    }
  });

  return fileList;
};

// Update package.json files
const updatePackageJson = (filePath) => {
  console.log(`Updating ${filePath}`);

  const packageJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let updated = false;

  // Update devDependencies
  if (packageJson.devDependencies) {
    Object.keys(targetVersions).forEach((dep) => {
      if (packageJson.devDependencies[dep]) {
        packageJson.devDependencies[dep] = targetVersions[dep];
        updated = true;
      }
    });
  }

  // Update dependencies
  if (packageJson.dependencies) {
    Object.keys(targetVersions).forEach((dep) => {
      if (packageJson.dependencies[dep]) {
        packageJson.dependencies[dep] = targetVersions[dep];
        updated = true;
      }
    });
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + "\n");
    console.log(`Updated ${filePath}`);
  }
};

// Main function
const main = () => {
  const packageJsonFiles = findPackageJsonFiles(".");

  packageJsonFiles.forEach(updatePackageJson);

  console.log(
    "\nAll package.json files updated with standardized Jest versions:"
  );
  Object.entries(targetVersions).forEach(([dep, version]) => {
    console.log(`- ${dep}: ${version}`);
  });

  console.log(
    '\nRun "yarn install" to update your node_modules with the new versions.'
  );
};

main();
