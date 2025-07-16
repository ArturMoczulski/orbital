import { Command } from "commander";
import fs from "fs";
import inquirer from "inquirer";
import _ from "lodash";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Add debug logging
const DEBUG = true;
function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}

/**
 * Get all available orchestrators from the orchestrators directory
 */
function getAvailableOrchestrators(): string[] {
  const orchestratorsDir = path.join(__dirname, "../orchestrators");
  const files = fs.readdirSync(orchestratorsDir);
  return files
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
    .map((file) => path.basename(file, path.extname(file)));
}

/**
 * Get all available workflows from the workflows directory
 */
function getAvailableWorkflows(): string[] {
  const workflowsDir = path.join(__dirname, "../workflows");
  const files = fs.readdirSync(workflowsDir);
  return files
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
    .map((file) => path.basename(file, path.extname(file)));
}

/**
 * Dynamically import a workflow module
 */
/**
 * Dynamically import an orchestrator module
 */
async function importOrchestrator(orchestratorName: string) {
  try {
    // Import the orchestrator module
    const orchestratorModule = await import(
      `../orchestrators/${orchestratorName}.js`
    );

    // Get the orchestrator function
    const orchestratorFn = orchestratorModule[orchestratorName];

    if (!orchestratorFn) {
      throw new Error(
        `Could not find orchestrator function in ${orchestratorName}.js`
      );
    }

    return orchestratorFn;
  } catch (error) {
    console.error(`Error importing orchestrator ${orchestratorName}:`, error);
    throw error;
  }
}

/**
 * Dynamically import a workflow module
 */
async function importWorkflow(workflowName: string) {
  try {
    // Import the workflow module
    const workflowModule = await import(`../workflows/${workflowName}.js`);

    // Get the workflow creation function (should be named createXXXWorkflow)
    const createWorkflowFn =
      workflowModule[
        `create${workflowName.charAt(0).toUpperCase() + workflowName.slice(1)}Workflow`
      ];

    if (!createWorkflowFn) {
      throw new Error(
        `Could not find workflow creation function in ${workflowName}.js`
      );
    }

    return {
      createWorkflow: createWorkflowFn,
      // Get any options interface or type that might be exported
      optionsType:
        workflowModule[
          `${workflowName.charAt(0).toUpperCase() + workflowName.slice(1)}Options`
        ],
    };
  } catch (error) {
    console.error(`Error importing workflow ${workflowName}:`, error);
    throw error;
  }
}

/**
 * Parse command line options into a workflow options object
 */
function parseOptions(options: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(options)) {
    // Handle nested paths using lodash's set
    _.set(result, key, parseOptionValue(value));
  }

  return result;
}

/**
 * Parse option value to the appropriate type
 */
function parseOptionValue(value: string): any {
  // Try to parse as number
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  // Try to parse as boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Try to parse as JSON
  try {
    return JSON.parse(value);
  } catch (e) {
    // Return as string if all else fails
    return value;
  }
}

/**
 * Main function to run a workflow
 */
async function runWorkflow() {
  const program = new Command();

  // Get available orchestrators and workflows
  const availableOrchestrators = getAvailableOrchestrators();
  const availableWorkflows = getAvailableWorkflows();

  program
    .name("workflow")
    .description("Run a workflow with a specific orchestrator")
    .argument(
      "<orchestrator>",
      `Orchestrator name (available: ${availableOrchestrators.join(", ")})`
    )
    .argument(
      "<workflow>",
      `Workflow name (available: ${availableWorkflows.join(", ")})`
    )
    .option(
      "-o, --outputDirectory <dir>",
      "Output directory for generated images"
    )
    .option(
      "--options <json>",
      "JSON string of options to pass to the workflow"
    )
    .allowUnknownOption(true) // Allow any option to be passed to the workflow
    .action(
      async (
        orchestratorName: string,
        workflowName: string,
        options: any,
        command: any
      ) => {
        try {
          // Check if orchestrator exists
          if (!availableOrchestrators.includes(orchestratorName)) {
            console.error(
              `Orchestrator "${orchestratorName}" not found. Available orchestrators: ${availableOrchestrators.join(", ")}`
            );
            process.exit(1);
          }

          // Check if workflow exists
          if (!availableWorkflows.includes(workflowName)) {
            console.error(
              `Workflow "${workflowName}" not found. Available workflows: ${availableWorkflows.join(", ")}`
            );
            process.exit(1);
          }

          // Import the orchestrator and workflow
          const orchestrator = await importOrchestrator(orchestratorName);
          const { createWorkflow } = await importWorkflow(workflowName);

          // Get all the unknown options
          const passedOptions: Record<string, string> = {};
          const args = command.args.slice(2); // Remove the orchestrator and workflow names

          // Parse all the unknown options
          for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith("--")) {
              const optionStr = arg.slice(2);
              if (optionStr.includes("=")) {
                // Handle --option=value format
                const [key, value] = optionStr.split("=", 2);
                passedOptions[key] = value;
              } else {
                // Handle --option value format
                const key = optionStr;
                const value = args[i + 1];
                if (value && !value.startsWith("--")) {
                  passedOptions[key] = value;
                  i++; // Skip the next argument as it's the value
                } else {
                  passedOptions[key] = "true"; // Flag option without value
                }
              }
            }
          }

          // Parse the options
          const parsedOptions = parseOptions(passedOptions);

          // Parse JSON options if provided
          if (options.options) {
            try {
              const jsonOptions = JSON.parse(options.options);
              // Merge JSON options with parsed options
              _.merge(parsedOptions, jsonOptions);
            } catch (error: any) {
              console.error(`Error parsing JSON options: ${error.message}`);
              process.exit(1);
            }
          }

          // Ensure we have an output directory
          if (!parsedOptions.outputDirectory) {
            // If not provided, ask the user
            const answers = await inquirer.prompt([
              {
                type: "input",
                name: "outputDirectory",
                message: "Enter output directory for generated images:",
                default: `output/${orchestratorName}_${workflowName}_${Date.now()}`,
              },
            ]);

            parsedOptions.outputDirectory = answers.outputDirectory;
          }

          debug("Running orchestrator:", orchestratorName);
          debug("With workflow:", workflowName);
          debug("With options:", parsedOptions);

          // Ensure the parsedOptions has the required outputDirectory property
          const workflowOptions = {
            outputDirectory: parsedOptions.outputDirectory,
            ...parsedOptions,
          };

          // Run the orchestrator with the workflow
          const result = await orchestrator(
            workflowOptions,
            createWorkflow,
            "8",
            workflowName
          );

          if (result) {
            console.log(`Successfully generated image at: ${result}`);
          } else {
            console.error("Failed to generate image");
          }
        } catch (error) {
          console.error("Error running workflow:", error);
        }
      }
    );

  program.parse();
}

// Run the workflow if this file is being executed directly
const isMainModule = process.argv[1] && process.argv[1].includes("workflow");
if (isMainModule) {
  runWorkflow();
}

// Export the function for use in other modules
export { runWorkflow };
