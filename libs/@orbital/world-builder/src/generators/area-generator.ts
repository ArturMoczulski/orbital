import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Area, Position, Logger } from "@orbital/core";
import { LLMObjectGenerationService, LLMPromptMessages } from "@orbital/llm";
import {
  GeneratedAreaSchema,
  GeneratedAreaData,
  createExampleAreaData,
} from "./area-schemas";
import {
  ObjectGenerator,
  ObjectGeneratorInputProps,
  ObjectGeneratorInputSchema,
} from "./object-generator";
import { z } from "zod";

/**
 * Zod schema for area generation prompt
 */
export const AreaGenerationInputSchema = ObjectGeneratorInputSchema.extend({
  /** Theme or setting of the area (e.g., "medieval castle", "futuristic city") */
  theme: z.string().default("fantasy").describe("Theme or setting of the area"),
  /** Mood or atmosphere of the area (e.g., "eerie", "cheerful") */
  mood: z
    .string()
    .default("neutral")
    .describe("Mood or atmosphere of the area"),
  /** Purpose or function of the area (e.g., "marketplace", "boss battle arena") */
  purpose: z
    .string()
    .default("exploration")
    .describe("Purpose or function of the area"),
  /** Any additional details or constraints */
  additionalDetails: z
    .string()
    .default("")
    .describe("Any additional details or constraints"),
}).describe("Input schema for area generation");

/**
 * Type for area generation prompt
 */
export type AreaGenerationPrompt = z.infer<typeof AreaGenerationInputSchema>;

/**
 * Class for generating game areas using LLMs
 */
export class AreaGenerator extends ObjectGenerator<Area, AreaGenerationPrompt> {
  /**
   * Creates a new AreaGenerator instance
   * @param model The language model to use for generation
   * @param generationService The service to use for LLM object generation
   * @param logger The logger to use
   */
  constructor(
    model: BaseLanguageModel,
    generationService: LLMObjectGenerationService,
    logger: Logger
  ) {
    super(model, generationService, logger);
  }

  /**
   * Returns the Zod schema for input validation
   * @returns The Zod schema for input
   */
  inputSchema() {
    return AreaGenerationInputSchema;
  }

  /**
   * Returns the Zod schema for output validation
   * @returns The Zod schema for output
   */
  schema() {
    return GeneratedAreaSchema;
  }

  /**
   * Returns an example object for this generator
   * @returns An example object
   */
  example(): Area {
    // Create an Area instance from the example data
    const exampleData = createExampleAreaData();
    const position = new Position(exampleData.position);

    const area = new Area({
      name: exampleData.name,
      position,
      parentId: exampleData.parentId ?? undefined,
    });

    // Assign all additional generated properties to the area
    Object.assign(area, {
      description: exampleData.description,
      landmarks: exampleData.landmarks,
      connections: exampleData.connections,
    });

    return area;
  }

  /**
   * Builds the LLM prompt for area generation
   * @param promptData The prompt data to use
   * @param retryCount Current retry count
   * @returns The built prompt string
   */
  protected instructions(
    promptData: AreaGenerationPrompt,
    retryCount: number = 0
  ): LLMPromptMessages {
    // Create system message with instructions
    let systemContent =
      "You are a creative video game world designer. Generate detailed areas for video games.";

    // Create human message with the prompt
    const humanContent = `Generate a detailed area for a video game based on the following parameters:

Theme: ${promptData.theme || "fantasy"}
Mood: ${promptData.mood || "neutral"}
Purpose: ${promptData.purpose || "exploration"}
Additional Details: ${promptData.additionalDetails || ""}`;

    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(humanContent),
    };
  }

  /**
   * Generates a new area based on the provided prompt
   * @param promptData The area generation prompt
   * @returns A Promise resolving to a new Area instance
   */
  async generate(promptData: AreaGenerationPrompt): Promise<Area> {
    // Use the parent class implementation which calls our schema() and example() methods
    const generatedData = await super.generate(promptData);

    // Create a Position instance
    const position = new Position(generatedData.position);

    // Create an Area instance with all base properties
    const area = new Area({
      name: generatedData.name,
      position,
      parentId: generatedData.parentId ?? undefined,
    });

    // Assign all additional generated properties to the area
    Object.assign(area, {
      description: generatedData.description,
      landmarks: generatedData.landmarks,
      connections: generatedData.connections,
    });

    return area;
  }
}
