// Import reflect-metadata for decorator support
import "reflect-metadata";

import { Command } from "commander";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";
import { generateArea } from "@orbital/world-builder";
import {
  ObjectGenerationRunnable,
  CompositeObjectGenerationRunnable,
} from "@orbital/llm";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ConsoleLogger, VerbosityLevel, schemaRegistry } from "@orbital/core";

// Create require function for ES modules
const require = createRequire(import.meta.url);
// Import chalk for colored console output
const chalk = require("chalk");

// Load environment variables from world-builder .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env.local");
console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({
  path: envPath,
});
console.log(
  `Environment variables loaded. OPENAI_MODEL_NAME=${process.env.OPENAI_MODEL_NAME}`
);

/**
 * Get a list of available types from the schema registry
 * This function looks for classes that have a corresponding {typeName}GenerationInput class
 */
function getAvailableTypes(): string[] {
  const availableTypes: string[] = [];

  // Get types from the schema registry
  console.log(chalk.blue("Looking for types in schema registry..."));

  // First, find all types that have a corresponding GenerationInput class
  for (const typeName of schemaRegistry.keys()) {
    // Check if there's a corresponding {typeName}GenerationInput in the registry
    const inputTypeName = `${typeName}GenerationInput`;
    if (schemaRegistry.has(inputTypeName)) {
      console.log(chalk.green(`Found type with input schema: ${typeName}`));
      availableTypes.push(typeName);
      continue;
    }

    // Special case for Area which uses AreaGenerationInput
    if (typeName === "Area" && schemaRegistry.has("AreaGenerationInput")) {
      console.log(
        chalk.green(`Found special case: Area with AreaGenerationInput`)
      );
      availableTypes.push(typeName);
      continue;
    }
  }

  // If no types are found in the registry, provide a helpful message
  if (availableTypes.length === 0) {
    console.log(
      chalk.yellow(
        "Warning: No types with corresponding GenerationInput classes found in schema registry. " +
          "Make sure classes are properly exported and registered with @ZodSchema decorator."
      )
    );
  }

  return availableTypes;
}

/**
 * Generic function to generate any type of object using CompositeObjectGenerationRunnable
 */
async function generateObject(
  typeName: string,
  model: BaseLanguageModel,
  inputData: any,
  config?: { verbose?: boolean }
): Promise<any> {
  // Create a logger if verbose mode is enabled
  const logger = config?.verbose
    ? new ConsoleLogger(VerbosityLevel.DEBUG, `${typeName}Generator`)
    : undefined;

  // For Area type, use the specialized generateArea function
  if (typeName === "Area") {
    return generateArea(model, inputData, config);
  }

  // Look for the type in the schema registry
  const registryEntry = schemaRegistry.get(typeName);
  if (!registryEntry) {
    // Get available types to provide a helpful error message
    const availableTypes = getAvailableTypes();

    throw new Error(
      `Type "${typeName}" not found in schema registry. Available types: ${availableTypes.join(
        ", "
      )}\n` +
        `Make sure the class is properly exported and registered with @ZodSchema decorator.`
    );
  }

  // Get the constructor from the registry entry
  const { ctor: TypeConstructor } = registryEntry;

  // Use CompositeObjectGenerationRunnable directly
  const runnable = new CompositeObjectGenerationRunnable(TypeConstructor, {
    // @ts-ignore: allow BaseLanguageModel without private internals
    model,
    logger,
  });

  // Use the single-input API
  return runnable.invoke(inputData, config);
}

/**
 * Command to list available types
 */
const listTypes = new Command("list-types")
  .description("List available object types that can be generated")
  .action(() => {
    const availableTypes = getAvailableTypes();
    console.log(chalk.blue("Available object types:"));

    if (availableTypes.length === 0) {
      console.log(
        chalk.yellow(
          "  No types found. Make sure classes are properly exported."
        )
      );
    } else {
      availableTypes.forEach((type) => {
        console.log(chalk.green(`  - ${type}`));
      });
    }
  });

const generate = new Command("generate")
  .description("Generate a new object of the specified type from a JSON input")
  .argument("<type>", "Type of object to generate (e.g., 'Area', 'City', etc.)")
  .argument(
    "<input>",
    "JSON string or path to JSON file containing generation input"
  )
  .option("-o, --output <file>", "Output file path (defaults to stdout)")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("-m, --model <name>", "Override the model name from .env.local")
  .option("-l, --list-types", "List available object types and exit")
  .action(
    async (
      type: string,
      input: string,
      options: {
        output?: string;
        verbose: boolean;
        model?: string;
        listTypes?: boolean;
      }
    ) => {
      try {
        // If --list-types flag is provided, list available types and exit
        if (options.listTypes) {
          const availableTypes = getAvailableTypes();
          console.log(chalk.blue("Available object types:"));

          if (availableTypes.length === 0) {
            console.log(
              chalk.yellow(
                "  No types found. Make sure classes are properly exported."
              )
            );
          } else {
            availableTypes.forEach((type) => {
              console.log(chalk.green(`  - ${type}`));
            });
          }
          return;
        }

        // Validate that the type exists before proceeding
        const availableTypes = getAvailableTypes();
        if (!availableTypes.includes(type)) {
          console.error(chalk.red(`Error: Type "${type}" not found.`));
          console.log(chalk.blue("Available types:"));

          if (availableTypes.length === 0) {
            console.log(
              chalk.yellow(
                "  No types found. Make sure classes are properly exported."
              )
            );
          } else {
            availableTypes.forEach((t) => {
              console.log(chalk.green(`  - ${t}`));
            });
          }
          process.exit(1);
        }

        console.log(chalk.blue(`🌍 Generating ${type} object...`));

        // Parse input (either JSON string or file path)
        let inputData: any;

        if (input.startsWith("{") || input.startsWith("[")) {
          // Input is a JSON string
          try {
            inputData = JSON.parse(input);
          } catch (error) {
            console.error(chalk.red("Error parsing JSON input:"), error);
            process.exit(1);
          }
        } else {
          // Input is a file path
          try {
            const filePath = path.resolve(process.cwd(), input);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            inputData = JSON.parse(fileContent);
          } catch (error) {
            console.error(
              chalk.red(`Error reading or parsing file ${input}:`),
              error
            );
            process.exit(1);
          }
        }

        // Make sure we don't have a 'verbose' property in the input data
        // as it would be treated as a nested object path
        if (inputData.verbose !== undefined) {
          console.warn(
            chalk.yellow(
              "Warning: Removing 'verbose' property from input data as it conflicts with the --verbose flag"
            )
          );
          delete inputData.verbose;
        }

        // Create OpenAI model
        const modelName =
          options.model || process.env.OPENAI_MODEL_NAME || "gpt-4o";
        const model = new OpenAI({
          modelName,
          temperature: 0.7,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });

        console.log(chalk.blue("🧠 Using model:"), modelName);

        // Generate object of the specified type
        const generatedObject = await generateObject(
          type,
          model as unknown as BaseLanguageModel,
          inputData,
          { verbose: options.verbose }
        );

        // Format the result
        const result = JSON.stringify(generatedObject, null, 2);

        // Output the result
        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output);
          fs.writeFileSync(outputPath, result);
          console.log(
            chalk.green(`✅ ${type} generated and saved to ${outputPath}`)
          );
        } else {
          console.log(chalk.green(`✅ Generated ${type}:`));
          console.log(result);
        }
      } catch (error) {
        console.error(chalk.red(`Error generating ${type}:`), error);

        // If the error is about a type not found, list available types
        if (error instanceof Error && error.message.includes("not found")) {
          const availableTypes = getAvailableTypes();
          console.log(chalk.blue("Available types:"));

          if (availableTypes.length === 0) {
            console.log(
              chalk.yellow(
                "  No types found. Make sure classes are properly exported."
              )
            );
          } else {
            availableTypes.forEach((t) => {
              console.log(chalk.green(`  - ${t}`));
            });
          }
        }

        process.exit(1);
      }
    }
  );

// Add the list-types command as a subcommand of generate
generate.addCommand(listTypes);

export default generate;
