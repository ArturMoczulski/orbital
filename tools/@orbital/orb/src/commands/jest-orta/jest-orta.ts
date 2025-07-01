import { execSync } from "child_process";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

const jestOrta = new Command("jest-orta")
  .description("Run Jest tests with VS Code Jest Orta plugin support")
  .allowUnknownOption() // Allow passing through all Jest options
  .argument("[args...]", "Jest arguments and test file paths")
  .action(async (args: string[], options: Record<string, unknown>) => {
    // If no args were passed, use all arguments after jest-orta
    let testArgs = args;
    if (!testArgs || testArgs.length === 0) {
      testArgs = process.argv.slice(process.argv.indexOf("jest-orta") + 1);
    }

    // Find the test file in arguments
    let testFile = "";
    for (const arg of testArgs) {
      // Check for .spec.ts files with full path
      if (arg.includes(".spec.ts")) {
        testFile = arg;
        break;
      }

      // Check for arguments that might contain a file path
      if (arg.includes("/") && arg.includes(".ts")) {
        testFile = arg;
        break;
      }
    }

    // If no test file found in arguments, try to extract from special format
    if (!testFile) {
      for (const arg of testArgs) {
        // VS Code Jest plugin might pass the test file in a special format
        if (arg.includes("TestProvider")) {
          // Extract the file path from the TestProvider string if possible
          const match = arg.match(/(libs|services)\/@orbital\/[^:]+/);
          if (match) {
            testFile = match[0];
            break;
          }

          // Check if it's an integration test pattern
          if (arg.includes("integration.spec")) {
            // Try to extract the file name from the test pattern
            const integrationMatch = arg.match(
              /([a-zA-Z0-9-]+)\.integration\.spec/
            );
            if (integrationMatch) {
              const fileName = integrationMatch[1];
              // Look for the file in common locations
              for (const pkgType of ["libs", "services"]) {
                for (const dir of ["src", "src/repositories", "src/utils"]) {
                  const possiblePath = `${pkgType}/@orbital/typegoose/${dir}/${fileName}.integration.spec.ts`;
                  if (fs.existsSync(path.join(process.cwd(), possiblePath))) {
                    testFile = possiblePath;
                    break;
                  }
                }
                if (testFile) break;
              }
            }
          }
        }

        // Check if the argument itself is a filename without a path
        if (arg.endsWith(".spec.ts") && !arg.includes("/")) {
          // This is likely just a filename without a path
          const fileName = arg
            .replace(".spec.ts", "")
            .replace(".integration.spec.ts", "")
            .replace(".e2e.spec.ts", "");

          // Determine if it's an integration test from the filename
          const isIntegration = arg.includes(".integration.spec.ts");
          const isE2E = arg.includes(".e2e.spec.ts");

          // Look for the file in common locations
          for (const pkgType of ["libs", "services"]) {
            for (const pkgName of [
              "typegoose",
              "core",
              "nest",
              "world",
              "player",
            ]) {
              for (const dir of [
                "src",
                "src/repositories",
                "src/utils",
                "src/models",
                "src/worlds",
                "src/areas",
              ]) {
                let possiblePath;
                if (isIntegration) {
                  possiblePath = `${pkgType}/@orbital/${pkgName}/${dir}/${fileName}.integration.spec.ts`;
                } else if (isE2E) {
                  possiblePath = `${pkgType}/@orbital/${pkgName}/${dir}/${fileName}.e2e.spec.ts`;
                } else {
                  possiblePath = `${pkgType}/@orbital/${pkgName}/${dir}/${fileName}.spec.ts`;
                }

                if (fs.existsSync(path.join(process.cwd(), possiblePath))) {
                  testFile = possiblePath;
                  break;
                }
              }
              if (testFile) break;
            }
            if (testFile) break;
          }

          if (testFile) break;
        }
      }
    }

    // If still no test file, check if we're in a specific test context
    if (!testFile) {
      for (const arg of testArgs) {
        if (arg.includes("document-repository.spec")) {
          // Check if it's an integration test
          if (arg.includes("integration")) {
            testFile =
              "libs/@orbital/typegoose/src/repositories/document-repository.integration.spec.ts";
          } else {
            testFile =
              "libs/@orbital/typegoose/src/repositories/document-repository.spec.ts";
          }
          break;
        }
      }
    }

    // If still no test file, try to determine the test type and use a default test file
    if (!testFile) {
      console.log("No test file found in arguments, using default test file");

      // Check if any arguments indicate integration test
      let isIntegration = false;
      for (const arg of testArgs) {
        if (arg.includes("integration")) {
          isIntegration = true;
          break;
        }
      }

      // Use document-repository test as default
      if (isIntegration) {
        testFile =
          "libs/@orbital/typegoose/src/repositories/document-repository.integration.spec.ts";
      } else {
        testFile =
          "libs/@orbital/typegoose/src/repositories/document-repository.spec.ts";
      }
    }

    // Convert absolute path to relative path if needed
    const projectRoot = process.cwd();
    if (testFile.includes(projectRoot)) {
      testFile = testFile.replace(projectRoot, "").replace(/^\//, "");
    }

    // Determine the package from the test file path
    let pkgType = "";
    let pkgName = "";

    if (testFile.includes("libs/@orbital/")) {
      pkgType = "libs";
      const match = testFile.match(/libs\/@orbital\/([^/]*)/);
      if (match) pkgName = match[1];
    } else if (testFile.includes("services/@orbital/")) {
      pkgType = "services";
      const match = testFile.match(/services\/@orbital\/([^/]*)/);
      if (match) pkgName = match[1];
    }

    if (!pkgType || !pkgName) {
      console.log(
        `Could not determine package from test file path: ${testFile}`
      );

      // Try to extract package info from the path
      if (testFile.includes("typegoose")) {
        pkgType = "libs";
        pkgName = "typegoose";
      } else if (testFile.includes("core")) {
        pkgType = "libs";
        pkgName = "core";
      } else if (testFile.includes("nest")) {
        pkgType = "libs";
        pkgName = "nest";
      } else if (testFile.includes("world")) {
        pkgType = "services";
        pkgName = "world";
      } else if (testFile.includes("player")) {
        pkgType = "services";
        pkgName = "player";
      } else {
        // If we still can't determine the package, use typegoose as a fallback
        console.log("Using typegoose as fallback package");
        pkgType = "libs";
        pkgName = "typegoose";

        // For document-repository tests, we know the location
        if (testFile.includes("document-repository")) {
          testFile =
            "libs/@orbital/typegoose/src/repositories/document-repository.spec.ts";

          // Check if it's an integration test
          for (const arg of testArgs) {
            if (arg.includes("integration")) {
              testFile =
                "libs/@orbital/typegoose/src/repositories/document-repository.integration.spec.ts";
              break;
            }
          }
        }
      }
    }

    // Clean the test file path
    const cleanTestFile = testFile.replace(/\\/g, "");

    // Extract just the filename without the path for better matching
    const filename = path.basename(cleanTestFile);

    // Determine test type (unit, integration, or e2e) based on file name
    let testType = "unit"; // Default to unit tests
    if (
      testFile.includes(".integration.spec.ts") ||
      filename.includes(".integration.spec.ts")
    ) {
      testType = "integration";
      console.log("Detected integration test from filename:", filename);
    } else if (
      testFile.includes(".e2e.spec.ts") ||
      filename.includes(".e2e.spec.ts")
    ) {
      testType = "e2e";
      console.log("Detected e2e test from filename:", filename);
    }

    // Also check if any arguments explicitly indicate the test type
    for (const arg of testArgs) {
      if (arg.includes("integration.spec")) {
        testType = "integration";
        break;
      } else if (arg.includes("e2e.spec")) {
        testType = "e2e";
        break;
      }
    }

    // Extract test name pattern if present
    let testNamePattern = "";
    for (let i = 0; i < testArgs.length - 1; i++) {
      if (testArgs[i] === "--testNamePattern") {
        testNamePattern = testArgs[i + 1];
        break;
      }
    }

    // Log the test type and filename for debugging
    console.log(`Running ${testType} test for file: ${filename}`);

    // Build the command to run
    const packageDir = path.join(process.cwd(), pkgType, "@orbital", pkgName);

    // Check if the package directory exists
    if (!fs.existsSync(packageDir)) {
      console.error(`Package directory not found: ${packageDir}`);
      process.exit(1);
    }

    // Build the command to run
    let command = "";

    // For integration tests, we need to be more specific about the test pattern
    if (testType === "integration") {
      // For integration tests, we need to use a specific pattern to match the file
      // This ensures Jest uses the correct pattern matching for integration tests
      const baseFilename = filename.includes(".integration.spec.ts")
        ? filename
        : filename.replace(".spec.ts", ".integration.spec.ts");

      // Use testRegex to override the existing testRegex in the config
      // Escape special characters in the filename to create a valid regex
      const escapedFilename = baseFilename.replace(/\./g, "\\.");

      // For VS Code Jest Orta plugin, we need to be even more explicit about the test pattern
      command = `cd "${packageDir}" && npx jest --config jest.${testType}.config.js --testRegex="${escapedFilename}$" --no-coverage --colors --verbose`;
    } else {
      command = `cd "${packageDir}" && npx jest --config jest.${testType}.config.js "${filename}" --no-coverage --colors`;
    }

    // Add test name pattern if present
    if (testNamePattern) {
      command += ` -t "${testNamePattern}"`;
    }

    // Execute the command
    try {
      execSync(command, { stdio: "inherit" });
    } catch (error) {
      // Jest will exit with non-zero code if tests fail, but we don't want to treat this as a command error
      process.exit(1);
    }
  });

export default jestOrta;
