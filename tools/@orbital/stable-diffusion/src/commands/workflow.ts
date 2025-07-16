import { Command } from "commander";
import fs from "fs";
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
    // No specific output option, everything is passed through --options
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
        console.log("Command-line options:", options);
        console.log("Command object:", command);
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
              console.log("Raw options string:", options.options);
              console.log("Options type:", typeof options.options);

              // Clean up the JSON string if needed
              let jsonString = options.options;

              // If the string is already an object, no need to parse
              let jsonOptions;
              if (typeof jsonString === "object") {
                jsonOptions = jsonString;
              } else {
                // Try to parse the JSON string
                try {
                  jsonOptions = JSON.parse(jsonString);
                } catch (parseError) {
                  // If parsing fails, try to clean up the string
                  // Remove any escape characters that might have been added by the shell
                  jsonString = jsonString.replace(/\\"/g, '"');
                  // If the string doesn't start with {, add it
                  if (!jsonString.startsWith("{")) {
                    jsonString = "{" + jsonString;
                  }
                  // If the string doesn't end with }, add it
                  if (!jsonString.endsWith("}")) {
                    jsonString = jsonString + "}";
                  }

                  console.log("Cleaned JSON string:", jsonString);
                  jsonOptions = JSON.parse(jsonString);
                }
              }

              console.log("Parsed JSON options:", jsonOptions);

              // Merge JSON options with parsed options
              _.merge(parsedOptions, jsonOptions);
              console.log("Merged options:", parsedOptions);
            } catch (error: any) {
              console.error(`Error parsing JSON options: ${error.message}`);
              console.error(`Raw options string: "${options.options}"`);
              process.exit(1);
            }
          }

          // Set default output directory if not provided
          if (!parsedOptions.output) {
            parsedOptions.output = `output/${orchestratorName}_${workflowName}_${Date.now()}`;
            console.log(
              `Using default output directory: ${parsedOptions.output}`
            );
          }

          debug("Running orchestrator:", orchestratorName);
          debug("With workflow:", workflowName);
          debug("With options:", parsedOptions);

          // Ensure the parsedOptions has the required output property
          // Note: We're spreading parsedOptions first, then setting output to ensure it's not overwritten
          const workflowOptions = {
            ...parsedOptions,
            output: parsedOptions.output,
          };

          console.log("Final workflow options:", workflowOptions);

          // Run the orchestrator with the workflow
          // Pass empty string for outputNodeId to let the orchestrator determine it dynamically
          const result = await orchestrator(
            workflowOptions,
            createWorkflow,
            "",
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
