#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

// Find all package.json files
const output = execSync(
  'find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.yarn/*"'
).toString();
const packageJsonFiles = output.trim().split("\n");

console.log(`Found ${packageJsonFiles.length} package.json files`);

// Add license field to each package.json file
let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const filePath of packageJsonFiles) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist: ${filePath}`);
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Update license field to a valid SPDX identifier
    if (packageJson.license === "PRIVATE") {
      packageJson.license = "UNLICENSED";
      console.log(
        `Updated license field from PRIVATE to UNLICENSED in ${filePath}`
      );
      updatedCount++;
    } else if (!packageJson.license) {
      packageJson.license = "UNLICENSED";
      console.log(`Added license field to ${filePath}`);
      updatedCount++;
    } else {
      console.log(
        `License field already exists in ${filePath}: ${packageJson.license}`
      );
      skippedCount++;
      continue;
    }

    // Write updated package.json
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + "\n");
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    errorCount++;
  }
}

console.log(`
Summary:
- Updated: ${updatedCount} files
- Skipped: ${skippedCount} files (license already exists)
- Errors: ${errorCount} files
`);
