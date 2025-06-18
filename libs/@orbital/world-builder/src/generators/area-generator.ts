import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Area, Position } from "@orbital/core";
import { LLMObjectGenerationService, LLMPromptMessages } from "@orbital/llm";
import {
  GeneratedAreaSchema,
  GeneratedAreaData,
  createExampleAreaData,
} from "./area-schemas";

/**
 * Schema for area generation prompt
 */
export interface AreaGenerationPrompt {
  /** Theme or setting of the area (e.g., "medieval castle", "futuristic city") */
  theme?: string;
  /** Mood or atmosphere of the area (e.g., "eerie", "cheerful") */
  mood?: string;
  /** Purpose or function of the area (e.g., "marketplace", "boss battle arena") */
  purpose?: string;
  /** Any additional details or constraints */
  additionalDetails?: string;
}

/**
 * Class for generating game areas using LLMs
 */
export class AreaGenerator {
  private model: BaseLanguageModel;
  private generationService: LLMObjectGenerationService;

  /**
   * Creates a new AreaGenerator instance
   * @param model The language model to use for generation
   * @param generationService The service to use for LLM object generation
   */
  constructor(
    model: BaseLanguageModel,
    generationService: LLMObjectGenerationService
  ) {
    this.model = model;
    this.generationService = generationService;
  }

  /**
   * Builds the messages for area generation
   * @param prompt The area generation prompt
   * @param retryCount Current retry count
   * @returns System and human messages for the LLM
   */
  private buildAreaMessages(
    prompt: Required<AreaGenerationPrompt>,
    retryCount: number
  ): LLMPromptMessages {
    // Create example data
    const exampleData = createExampleAreaData();
    const exampleJson = JSON.stringify(exampleData, null, 2);

    // Create system message with instructions
    const systemContent =
      retryCount > 0
        ? "You are a creative video game world designer. Generate detailed areas for video games. Your previous response did not match the required schema. Please try again and ensure your response follows the format instructions exactly. IMPORTANT: Your response must be a valid JSON object WITHOUT any markdown formatting. Do not use ```json code blocks or any other markdown. Return ONLY the raw JSON object."
        : "You are a creative video game world designer. Generate detailed areas for video games. IMPORTANT: Your response must be a valid JSON object WITHOUT any markdown formatting. Do not use ```json code blocks or any other markdown. Return ONLY the raw JSON object.";

    // Create human message with the prompt
    const humanContent = `Generate a detailed area for a video game based on the following parameters:

Theme: ${prompt.theme}
Mood: ${prompt.mood}
Purpose: ${prompt.purpose}
Additional Details: ${prompt.additionalDetails}

Here is an example of a valid response:

\`\`\`json
${exampleJson}
\`\`\`
`;

    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(humanContent),
    };
  }

  /**
   * Generates a new area based on the provided prompt
   * @param prompt The area generation prompt
   * @returns A Promise resolving to a new Area instance
   */
  async generateArea(prompt: AreaGenerationPrompt): Promise<Area> {
    // Set default values for any missing prompt fields
    const fullPrompt: Required<AreaGenerationPrompt> = {
      theme: prompt.theme || "fantasy",
      mood: prompt.mood || "neutral",
      purpose: prompt.purpose || "exploration",
      additionalDetails: prompt.additionalDetails || "",
    };

    // Generate the area data using the LLM generation service
    const result =
      await this.generationService.generateObject<GeneratedAreaData>(
        GeneratedAreaSchema,
        (retryCount: number) => this.buildAreaMessages(fullPrompt, retryCount)
      );

    // Create a Position instance
    const position = new Position(result.position);

    // Create an Area instance
    const area = new Area({
      name: result.name,
      position: position,
    });

    return area;
  }

  /**
   * Generates multiple connected areas to form a region
   * @param basePrompt The base prompt for the region
   * @param count Number of areas to generate
   * @returns A Promise resolving to an array of connected Area instances
   */
  async generateRegion(
    basePrompt: AreaGenerationPrompt,
    count: number = 5
  ): Promise<Area[]> {
    // Generate the first area
    const firstArea = await this.generateArea(basePrompt);

    // Create an array to hold all areas
    const areas: Area[] = [firstArea];

    // Generate additional areas
    for (let i = 1; i < count; i++) {
      // Create a connected prompt
      const connectedPrompt: AreaGenerationPrompt = {
        ...basePrompt,
        additionalDetails: `${basePrompt.additionalDetails || ""}
          This area should connect to "${
            firstArea.name
          }" and maintain the overall theme and mood.
          Make sure this area is distinct from the other areas but fits within the same region.`,
      };

      // Generate a new area
      const newArea = await this.generateArea(connectedPrompt);

      // Explicitly set a different position to ensure non-zero distance
      // We'll use a simple pattern to place areas in a circle around the first area
      const angle = (i / count) * Math.PI * 2;
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
