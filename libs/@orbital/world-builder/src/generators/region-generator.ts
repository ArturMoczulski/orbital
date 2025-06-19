import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Area, Position, Logger } from "@orbital/core";
import { LLMObjectGenerationService, LLMPromptMessages } from "@orbital/llm";
import {
  ObjectGenerator,
  ObjectGeneratorInputProps,
  ObjectGeneratorInputSchema,
} from "./object-generator";
import { z } from "zod";

/**
 * Zod schema for region generation prompt
 */
export const RegionGenerationInputSchema = ObjectGeneratorInputSchema.extend({
  /** Theme or setting of the region (e.g., "medieval castle", "futuristic city") */
  theme: z
    .string()
    .default("fantasy")
    .describe("Theme or setting of the region"),
  /** Mood or atmosphere of the region (e.g., "eerie", "cheerful") */
  mood: z
    .string()
    .default("neutral")
    .describe("Mood or atmosphere of the region"),
  /** Purpose or function of the region (e.g., "marketplace", "boss battle arena") */
  purpose: z
    .string()
    .default("exploration")
    .describe("Purpose or function of the region"),
  /** Any additional details or constraints */
  additionalDetails: z
    .string()
    .default("")
    .describe("Any additional details or constraints"),
  /** Base area to connect the region to */
  baseArea: z.any().optional().describe("Base area to connect the region to"),
  /** Number of areas to generate in the region */
  areaCount: z
    .number()
    .default(5)
    .describe("Number of areas to generate in the region"),
}).describe("Input schema for region generation");

/**
 * Type for region generation prompt
 */
export type RegionGenerationInputProps = z.infer<
  typeof RegionGenerationInputSchema
>;

/**
 * Schema for region data
 */
export const RegionSchema = z
  .array(z.any())
  .describe("Array of areas forming a region");

/**
 * Class for generating game regions using LLMs
 */
export class RegionGenerator extends ObjectGenerator<
  Area[],
  RegionGenerationInputProps
> {
  /**
   * Creates a new RegionGenerator instance
   * @param model The language model to use for generation
   * @param generationService The service to use for LLM object generation
   * @param logger The logger to use
   * @param areaGenerator Optional AreaGenerator to use for generating individual areas
   */
  constructor(
    model: BaseLanguageModel,
    generationService: LLMObjectGenerationService,
    logger: Logger,
    private areaGenerator?: AreaGenerator // Will be imported later to avoid circular dependency
  ) {
    super(model, generationService, logger);
  }

  /**
   * Sets the area generator to use
   * @param areaGenerator The area generator to use
   */
  setAreaGenerator(areaGenerator: AreaGenerator): void {
    this.areaGenerator = areaGenerator;
  }

  /**
   * Returns the Zod schema for input validation
   * @returns The Zod schema for input
   */
  inputSchema() {
    return RegionGenerationInputSchema;
  }

  /**
   * Returns the Zod schema for output validation
   * @returns The Zod schema for output
   */
  schema() {
    return RegionSchema;
  }

  /**
   * Returns an example object for this generator
   * @returns An example object
   */
  example(): Area[] {
    return []; // Regions are just arrays of areas
  }

  /**
   * Builds the LLM prompt for region generation
   * @param promptData The prompt data to use
   * @param retryCount Current retry count
   * @returns The built prompt messages
   */
  protected instructions(
    promptData: RegionGenerationInputProps,
    retryCount: number = 0
  ): LLMPromptMessages {
    // This method is not directly used for region generation since we delegate to AreaGenerator
    // But we implement it to satisfy the abstract class requirements
    const systemContent =
      "You are a creative video game world designer. Generate a cohesive region with multiple connected areas for video games.";

    const humanContent = `Generate a detailed region for a video game based on the following parameters:

Theme: ${promptData.theme || "fantasy"}
Mood: ${promptData.mood || "neutral"}
Purpose: ${promptData.purpose || "exploration"}
Additional Details: ${promptData.additionalDetails || ""}
Number of Areas: ${promptData.areaCount || 5}
`;

    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(humanContent),
    };
  }

  /**
   * Generates a region with multiple connected areas
   * @param promptData The region generation prompt
   * @returns A Promise resolving to an array of connected Area instances
   */
  async generate(promptData: RegionGenerationInputProps): Promise<Area[]> {
    if (!this.areaGenerator) {
      throw new Error("AreaGenerator must be set before generating regions");
    }

    // Set default values for any missing prompt fields
    const fullPrompt: Omit<RegionGenerationInputProps, "baseArea"> & {
      areaCount: number;
    } = {
      theme: promptData.theme || "fantasy",
      mood: promptData.mood || "neutral",
      purpose: promptData.purpose || "exploration",
      additionalDetails: promptData.additionalDetails || "",
      areaCount: promptData.areaCount || 5,
    };

    // Generate or use the base area
    const firstArea =
      promptData.baseArea ||
      (await this.areaGenerator.generate({
        theme: fullPrompt.theme,
        mood: fullPrompt.mood,
        purpose: fullPrompt.purpose,
        additionalDetails: fullPrompt.additionalDetails,
      }));

    // Create an array to hold all areas
    const areas: Area[] = [firstArea];

    // Generate additional areas
    for (let i = 1; i < fullPrompt.areaCount; i++) {
      // Create a connected prompt
      const connectedPrompt: RegionGenerationInputProps = {
        ...fullPrompt,
        additionalDetails: `${fullPrompt.additionalDetails}
          This area should connect to "${firstArea.name}" and maintain the overall theme and mood.
          Make sure this area is distinct from the other areas but fits within the same region.`,
      };

      // Generate a new area
      const newArea = await this.areaGenerator.generate(connectedPrompt);

      // Explicitly set a different position to ensure non-zero distance
      // We'll use a simple pattern to place areas in a circle around the first area
      const angle = (i / fullPrompt.areaCount) * Math.PI * 2;
      const radius = 200; // Large enough to ensure visible separation

      // Create a new Position with explicit coordinates
      const newPosition = new Position({
        x: firstArea.position.x + Math.cos(angle) * radius,
        y: firstArea.position.y + Math.sin(angle) * radius,
        z: firstArea.position.z + i * 10, // Increase height with each area
      });

      // Set the position on the area
      newArea.position = newPosition;

      // Add to the array
      areas.push(newArea);
    }

    return areas;
  }
}

// Import at the end to avoid circular dependency
import { AreaGenerator } from "./area-generator";
