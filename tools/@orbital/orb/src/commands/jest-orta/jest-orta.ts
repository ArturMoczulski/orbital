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
        }
      }
    }

    // If still no test file, check if we're in a specific test context
    if (!testFile) {
      for (const arg of testArgs) {
        if (arg.includes("document-repository.spec")) {
          testFile =
            "libs/@orbital/typegoose/src/repositories/document-repository.spec.ts";
          break;
        }
      }
    }

    // If still no test file, fall back to running Jest with root config
    if (!testFile) {
      console.log(
        "No test file found in arguments, falling back to Jest with root config"
      );
      try {
        execSync(`jest --config jest.config.cjs ${testArgs.join(" ")}`, {
          stdio: "inherit",
        });
      } catch (error) {
        process.exit(1);
      }
      return;
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
      console.log("Falling back to Jest with root config");
      try {
        execSync(`jest --config jest.config.cjs ${testArgs.join(" ")}`, {
          stdio: "inherit",
        });
      } catch (error) {
        process.exit(1);
      }
      return;
    }

    // Determine test type (unit, integration, or e2e) based on file name
    let testType = "unit"; // Default to unit tests
    if (testFile.includes(".integration.spec.ts")) {
      testType = "integration";
    } else if (testFile.includes(".e2e.spec.ts")) {
      testType = "e2e";
    }

    // Clean the test file path
    const cleanTestFile = testFile.replace(/\\/g, "");

    // Extract test name pattern if present
    let testNamePattern = "";
    for (let i = 0; i < testArgs.length - 1; i++) {
      if (testArgs[i] === "--testNamePattern") {
        testNamePattern = testArgs[i + 1];
        break;
      }
    }

    // Extract just the filename without the path for better matching
    const filename = path.basename(cleanTestFile);

    // Build the command to run
    const packageDir = path.join(process.cwd(), pkgType, "@orbital", pkgName);

    // Check if the package directory exists
    if (!fs.existsSync(packageDir)) {
      console.error(`Package directory not found: ${packageDir}`);
      process.exit(1);
    }

    let command = `cd "${packageDir}" && npx jest --config jest.${testType}.config.js "${filename}" --no-coverage --colors`;

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
