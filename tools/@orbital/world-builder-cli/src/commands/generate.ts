// Import reflect-metadata for decorator support
import "reflect-metadata";

import { Command } from "commander";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";
import {
  generateArea,
  AreaGenerationInput,
  AreaGenerationInputSchema,
} from "@orbital/world-builder";
import {
  ObjectGenerationRunnable,
  CompositeObjectGenerationRunnable,
} from "@orbital/llm";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import {
  Area,
  AreaSchema,
  AreaMap,
  AreaMapSchema,
  AreaMapTiles,
  AreaMapGenerationInput,
  AreaMapGenerationInputSchema,
  zodSchemaRegistry,
  ConsoleLogger,
  VerbosityLevel,
  Position,
  PositionSchema,
} from "@orbital/core";

// Create require function for ES modules
const require = createRequire(import.meta.url);
// Import chalk for colored console output
const chalk = require("chalk");

// Load environment variables from world-builder .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
});

const generate = new Command("generate")
  .description("Generate a new Area object from a combined JSON input")
  .argument(
    "<input>",
    "JSON string or path to JSON file containing area generation input"
  )
  .option("-o, --output <file>", "Output file path (defaults to stdout)")
  .option("-v, --verbose", "Enable verbose output", false)
  .action(
    async (input: string, options: { output?: string; verbose: boolean }) => {
      try {
        console.log(chalk.blue("🌍 Generating area..."));

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
        const model = new OpenAI({
          modelName: process.env.OPENAI_MODEL || "gpt-4",
          temperature: 0.7,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });

        // Set up logger for verbose output
        const logger = options.verbose
          ? new ConsoleLogger(VerbosityLevel.DEBUG, "AreaGenerator")
          : undefined;

        console.log(
          chalk.blue("🧠 Using model:"),
          process.env.OPENAI_MODEL || "gpt-4"
        );

        // Generate area
        const area = await generateArea(
          model as unknown as BaseLanguageModel,
          inputData,
          { verbose: options.verbose }
        );

        // Format the result
        const result = JSON.stringify(area, null, 2);

        // Output the result
        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output);
          fs.writeFileSync(outputPath, result);
          console.log(
            chalk.green(`✅ Area generated and saved to ${outputPath}`)
          );
        } else {
          console.log(chalk.green("✅ Generated Area:"));
          console.log(result);
        }
      } catch (error) {
        console.error(chalk.red("Error generating area:"), error);
        process.exit(1);
      }
    }
  );

export default generate;
