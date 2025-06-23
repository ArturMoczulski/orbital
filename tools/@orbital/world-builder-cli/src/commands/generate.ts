// Import reflect-metadata for decorator support
import "reflect-metadata";

import { Command } from "commander";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as path from "path";
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
    async (input: string, options: { output?: string; verbose: boolean }) => {}
  );

export default generate;
