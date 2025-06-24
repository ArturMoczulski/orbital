// Import reflect-metadata for decorator support
import "@orbital/world-builder";
import { z } from "zod";
import { schemaRegistry, zodSchemaRegistry } from "@orbital/core";
import "reflect-metadata";

import { Command } from "commander";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

import { OpenAI } from "@langchain/openai";
import { getGeneratableTypes } from "@orbital/llm";
import { promptRepository } from "@orbital/world-builder";
import {
  ObjectGenerationRunnable,
  CompositeObjectGenerationRunnable,
} from "@orbital/llm";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ConsoleLogger, VerbosityLevel } from "@orbital/core";

// Create require function for ES modules
const require = createRequire(import.meta.url);
// Import chalk for colored console output
const chalk = require("chalk");

// Load environment variables from world-builder .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env.local");

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

  // Look for the type in the generatable types list
  const availableTypes = getGeneratableTypes();
  if (!availableTypes.includes(typeName)) {
    throw new Error(
      `Type "${typeName}" not found in registry. Available types: ${availableTypes.join(
        ", "
      )}`
    );
  }

  // Resolve constructor via registry
  const entry = schemaRegistry.get(typeName);
  if (!entry) {
    throw new Error(`Type "${typeName}" not found in registry.`);
  }
  const ctor = entry.ctor;
  const inputKey = `${typeName}GenerationInput`;
  const inputEntry = schemaRegistry.get(inputKey);
  // Use partial input schema to allow missing optional fields
  const rawInputSchema = inputEntry?.schema;
  const inputSchema =
    rawInputSchema instanceof z.ZodObject
      ? rawInputSchema.partial()
      : rawInputSchema;
  const runnable = new CompositeObjectGenerationRunnable(ctor, {
    model,
    logger,
    inputSchema,
    schemaRegistry: zodSchemaRegistry,
    systemPrompt: promptRepository.get(typeName),
  });

  return runnable.invoke(inputData, config);
}

/**
 * Command to list available types
 */
const listTypes = new Command("list-types")
  .description("List available object types that can be generated")
  .action(() => {
    const types = getGeneratableTypes();
    console.log(chalk.blue("Available object types:"));
    if (types.length === 0) {
      console.log(chalk.yellow("  No types found."));
    } else {
      types.forEach((t: string) => console.log(chalk.green(`  - ${t}`)));
    }
  });

const generate = new Command("generate")
  .description("Generate a new object of the specified type from a JSON input")
  .argument("<type>", "Type of object to generate")
  .argument(
    "<input>",
    "JSON string or path to JSON file containing generation input"
  )
  .option("-o, --output <file>", "Output file path (defaults to stdout)")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("-m, --model <name>", "Override the model name from .env.local")
  .option("-l, --list-types", "List available object types and exit")
  .action(async (type: string, input: string, options) => {
    try {
      if (options.listTypes) {
        await listTypes.parseAsync(["list-types"]);
        return;
      }

      console.log(chalk.blue(`🌍 Generating ${type} object...`));

      // Parse input (string or file)
      let inputData: any;
      if (input.startsWith("{") || input.startsWith("[")) {
        inputData = JSON.parse(input);
      } else {
        const filePath = path.resolve(process.cwd(), input);
        inputData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }

      if (inputData.verbose !== undefined) {
        console.warn(
          chalk.yellow(
            "Warning: Removing 'verbose' property from input data as it conflicts with the --verbose flag"
          )
        );
        delete inputData.verbose;
      }

      const modelName =
        options.model || process.env.OPENAI_MODEL_NAME || "gpt-4o";
      const model = new OpenAI({
        modelName,
        temperature: 0.7,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
      console.log(chalk.blue("🧠 Using model:"), modelName);

      const resultObj = await generateObject(
        type,
        model as unknown as BaseLanguageModel,
        inputData,
        { verbose: options.verbose }
      );

      const result = JSON.stringify(resultObj, null, 2);
      if (options.output) {
        const outPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outPath, result);
        console.log(
          chalk.green(`✅ ${type} generated and saved to ${outPath}`)
        );
      } else {
        console.log(chalk.green(`✅ Generated ${type}:`));
        console.log(result);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error generating ${type}:`), err);
      process.exit(1);
    }
  });

// Add list-types as subcommand
generate.addCommand(listTypes);

export default generate;
