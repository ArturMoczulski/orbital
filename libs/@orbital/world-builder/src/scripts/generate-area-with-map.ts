#!/usr/bin/env ts-node

import { Ollama } from "@langchain/community/llms/ollama";
import {
  Area,
  AreaMap,
  AreaSchema,
  AreaMapSchema,
  ConsoleLogger,
  VerbosityLevel,
  zodSchemaRegistry,
} from "@orbital/core";
import {
  AreaGenerationInput,
  AreaGenerationInputSchema,
} from "../area/area-generation-input";
import {
  AreaMapGenerationInput,
  AreaMapGenerationInputSchema,
} from "@orbital/core";
import {
  CompositeObjectGenerationRunnable,
  ObjectGenerationRunnable,
} from "@orbital/llm";
import { promptRepository } from "../object-generation-prompt-repository";

// Configure logger with verbose level for debugging
const logger = new ConsoleLogger(VerbosityLevel.VERBOSE);

/**
 * Check if Ollama is available
 * @param baseUrl The Ollama base URL
 * @returns A promise that resolves to true if Ollama is available, false otherwise
 */
async function checkOllamaAvailability(
  baseUrl: string = "http://localhost:11434"
): Promise<boolean> {
  try {
    logger.info(`Checking Ollama availability at ${baseUrl}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      logger.info(
        `Ollama is available. Available models: ${
          data.models?.map((m: any) => m.name).join(", ") || "None"
        }`
      );
      return true;
    } else {
      logger.error(
        `Ollama returned status ${response.status}: ${response.statusText}`
      );
      return false;
    }
  } catch (error) {
    logger.error(`Failed to connect to Ollama:`, error);
    return false;
  }
}

/**
 * Create an Ollama LLM instance
 * @param model The model name to use (default: llama3)
 * @returns An Ollama LLM instance
 */
function createLLM(model: string = "gemma3:latest") {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  logger.info(`Creating Ollama LLM with model: ${model}, baseUrl: ${baseUrl}`);
  return new Ollama({
    model,
    baseUrl,
    temperature: 0.7,
  });
}

/**
 * Generate an area with a nested area map
 * @param areaInput The area generation input
 * @param areaMapInput The area map generation input
 * @param modelName The LLM model name to use
 * @param verbose Whether to enable verbose logging
 * @returns The generated area with a nested area map
 */
async function generateAreaWithMap(
  areaInput: AreaGenerationInput,
  areaMapInput: AreaMapGenerationInput,
  modelName: string = "gemma3:latest",
  verbose: boolean = false
): Promise<Area> {
  // Check if Ollama is available
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaAvailable = await checkOllamaAvailability(baseUrl);

  if (!ollamaAvailable) {
    throw new Error(
      `Ollama is not available at ${baseUrl}. Please make sure Ollama is running and the model '${modelName}' is available.`
    );
  }

  // Create the LLM
  const llm = createLLM(modelName);

  // Register schemas and classes globally to ensure they can be found by the CompositeObjectGenerationRunnable
  (globalThis as any).Area = Area;
  (globalThis as any).AreaMap = AreaMap;
  (globalThis as any).AreaGenerationInputSchema = AreaGenerationInputSchema;
  // Register schemas and classes with more explicit logging
  logger.info("Registering schemas and classes globally...");
  (globalThis as any).Area = Area;
  logger.info(`Registered Area class: ${typeof (globalThis as any).Area}`);

  (globalThis as any).AreaMap = AreaMap;
  logger.info(
    `Registered AreaMap class: ${typeof (globalThis as any).AreaMap}`
  );

  (globalThis as any).AreaGenerationInputSchema = AreaGenerationInputSchema;
  logger.info(
    `Registered AreaGenerationInputSchema: ${typeof (globalThis as any)
      .AreaGenerationInputSchema}`
  );

  (globalThis as any).AreaMapGenerationInputSchema =
    AreaMapGenerationInputSchema;
  logger.info(
    `Registered AreaMapGenerationInputSchema: ${typeof (globalThis as any)
      .AreaMapGenerationInputSchema}`
  );

  // Explicitly register schemas in the zodSchemaRegistry
  logger.info("Explicitly registering schemas in zodSchemaRegistry...");
  zodSchemaRegistry.set(Area, AreaSchema);
  logger.info("Registered Area schema in zodSchemaRegistry");

  zodSchemaRegistry.set(AreaMap, AreaMapSchema);
  logger.info("Registered AreaMap schema in zodSchemaRegistry");

  zodSchemaRegistry.set(
    AreaMapGenerationInputSchema,
    AreaMapGenerationInputSchema
  );
  logger.info("Registered AreaMapGenerationInputSchema in zodSchemaRegistry");

  zodSchemaRegistry.set(AreaGenerationInputSchema, AreaGenerationInputSchema);
  logger.info("Registered AreaGenerationInputSchema in zodSchemaRegistry");

  logger.info("Starting area generation with nested area map...");

  try {
    // Create simple plain objects for inputs
    const areaInputObj = {
      climate: areaInput.climate,
      description: areaInput.description,
    };

    // Keep the area map input object exactly matching the schema
    const areaMapInputObj = {
      size: areaMapInput.size,
      description: areaMapInput.description,
    };

    // Log the input objects with more detail
    logger.info(
      `Area input object (type: ${typeof areaInputObj}): ${JSON.stringify(
        areaInputObj,
        null,
        2
      )}`
    );
    logger.info(`Area input climate: ${areaInputObj.climate}`);
    logger.info(`Area input description: ${areaInputObj.description}`);
    logger.info(
      `Area map input object (type: ${typeof areaMapInputObj}): ${JSON.stringify(
        areaMapInputObj,
        null,
        2
      )}`
    );

    // Create a session ID for this invocation
    const sessionId = `area-generation-${Date.now()}`;
    logger.info(`Using session ID: ${sessionId}`);

    // Create the composite runnable with explicit options
    logger.info(
      `Creating CompositeObjectGenerationRunnable for type: ${Area.name}`
    );
    const runnable = new CompositeObjectGenerationRunnable(Area, {
      model: llm as any, // Type assertion to avoid compatibility issues
      promptRepository,
      inputSchema: AreaGenerationInputSchema,
      // No need to explicitly provide the output schema as it's registered via @ZodSchema
      logger,
      maxAttempts: 1, // Reduce attempts for faster debugging
      systemPrompt:
        "You are a generator of fantasy areas with nested area maps. The area MUST have an 'areaMap' property. DO NOT return the schema definition - return a valid object that matches the schema.",
    });

    // Generate the area with nested area map
    logger.info("Invoking composite runnable...");
    const result = await runnable.invoke(
      areaInputObj,
      { areaMap: areaMapInputObj },
      {
        configurable: {
          sessionId,
          useHistory: false, // Disable history to avoid any issues
        },
        verbose, // Move verbose to the top level of the config object
      }
    );

    logger.info("Area generation completed successfully!");
    return result;
  } catch (error) {
    logger.error("Error generating area:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}`);
      logger.error(`Error message: ${error.message}`);
      logger.error(`Error stack: ${error.stack}`);
    }

    throw error;
  }
}

/**
 * Main function to parse command line arguments and generate an area
 */
async function main() {
  try {
    // Default values
    const defaultAreaInput = {
      climate: "temperate forest",
      description:
        "A small village surrounded by dense forest with a river running through it.",
    };

    const defaultAreaMapInput = {
      size: "32x32",
      description:
        "A village with 5-7 buildings, a river running east to west, forest to the north, and a road leading south.",
    };

    // Parse command line arguments
    const args = process.argv.slice(2);
    let climate = defaultAreaInput.climate;
    let areaDescription = defaultAreaInput.description;
    let mapSize = defaultAreaMapInput.size;
    let mapDescription = defaultAreaMapInput.description;
    let modelName = "gemma3:latest";
    let verbose = false;

    // Simple argument parsing
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === "--climate" && i + 1 < args.length) {
        climate = args[++i];
      } else if (arg === "--area-description" && i + 1 < args.length) {
        areaDescription = args[++i];
      } else if (arg === "--map-size" && i + 1 < args.length) {
        mapSize = args[++i];
      } else if (arg === "--map-description" && i + 1 < args.length) {
        mapDescription = args[++i];
      } else if (arg === "--model" && i + 1 < args.length) {
        modelName = args[++i];
      } else if (arg === "--verbose") {
        verbose = true;
      } else if (arg === "--help") {
        printHelp();
        process.exit(0);
      }
    }

    // Create input objects
    const areaInput = new AreaGenerationInput({
      climate,
      description: areaDescription,
    });

    const areaMapInput = new AreaMapGenerationInput({
      size: mapSize,
      description: mapDescription,
    });

    // Generate the area
    logger.info("Generating area with the following inputs:");
    logger.info("Area Input:", JSON.stringify(areaInput, null, 2));
    logger.info("Area Map Input:", JSON.stringify(areaMapInput, null, 2));

    const area = await generateAreaWithMap(
      areaInput,
      areaMapInput,
      modelName,
      verbose
    );

    // Output the result
    console.log("\n=== Generated Area ===\n");
    console.log(JSON.stringify(area, null, 2));

    // Save to file if requested
    if (args.includes("--save")) {
      const fs = require("fs");
      const outputFile = `area-${Date.now()}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(area, null, 2));
      logger.info(`Area saved to ${outputFile}`);
    }
  } catch (error) {
    logger.error("Error in main function:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}`);
      logger.error(`Error message: ${error.message}`);
      logger.error(`Error stack: ${error.stack}`);

      // Check for common issues
      if (error.message.includes("Ollama is not available")) {
        console.error("\nERROR: Ollama is not running or not accessible.");
        console.error("Please make sure Ollama is installed and running:");
        console.error("1. Install Ollama from https://ollama.com/");
        console.error("2. Start Ollama");
        console.error("3. Pull the required model: ollama pull gemma3:latest");
      } else if (
        error.message.includes("model") &&
        error.message.includes("not found")
      ) {
        console.error("\nERROR: The specified model was not found in Ollama.");
        console.error(
          "Try pulling the model first with: ollama pull <model-name>"
        );
        console.error("For example: ollama pull gemma3:latest");
      }
    }

    process.exit(1);
  }
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Usage: ts-node generate-area-with-map.ts [options]

Options:
  --climate <climate>               Climate of the area (default: "temperate forest")
  --area-description <description>  Description of the area
  --map-size <size>                 Size of the map (e.g., "32x32")
  --map-description <description>   Description of the map
  --model <model>                   LLM model to use (default: "gemma3:latest") - must be available in Ollama
  --verbose                         Enable verbose logging
  --save                            Save the generated area to a file
  --help                            Show this help message
  
Examples:
  ts-node generate-area-with-map.ts
  ts-node generate-area-with-map.ts --climate "snowy mountains" --area-description "A small mining town in the mountains" --map-size "24x24" --map-description "A mining town with 5 buildings and mine entrance to the north"
  `);
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

// Export for use in other modules
export { generateAreaWithMap };
