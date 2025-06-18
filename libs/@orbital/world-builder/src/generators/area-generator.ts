import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Area, Position } from "@orbital/core";

/**
 * Configuration options for the AreaGenerator
 */
export interface AreaGeneratorOptions {
  /** The language model to use for generation */
  model: BaseLanguageModel;
}

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
 * Class for generating game areas using LangChain and LLMs
 */
export class AreaGenerator {
  private model: BaseLanguageModel;
  private areaGenerationChain: RunnableSequence;

  /**
   * Creates a new AreaGenerator instance
   * @param options Configuration options
   */
  constructor(options: AreaGeneratorOptions) {
    // Use the provided language model
    this.model = options.model;

    // Create the output parser for structured area data
    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        name: z.string().describe("The name of the area"),
        description: z.string().describe("A detailed description of the area"),
        position: z
          .object({
            x: z.number().describe("X coordinate"),
            y: z.number().describe("Y coordinate"),
            z: z.number().describe("Z coordinate"),
          })
          .describe("The 3D position of the area"),
        landmarks: z
          .array(z.string())
          .describe("Notable landmarks or features in this area"),
        connections: z
          .array(z.string())
          .describe("Names of other areas this area connects to"),
      })
    );

    // Create the prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are a creative video game world designer. Generate a detailed area for a video game based on the following parameters:
      
      Theme: {theme}
      Mood: {mood}
      Purpose: {purpose}
      Additional Details: {additionalDetails}
      
      ${outputParser.getFormatInstructions()}
    `);

    // Create the generation chain
    this.areaGenerationChain = RunnableSequence.from([
      promptTemplate,
      this.model,
      outputParser,
    ]);
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

    // Generate the area data using the LLM chain
    const result = await this.areaGenerationChain.invoke(fullPrompt);

    // Create a new Area instance from the generated data
    return new Area({
      name: result.name,
      position: new Position(result.position),
      // Additional metadata could be stored in a custom field if Area supports it
    });
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
    const areas: Area[] = [];

    // Generate the first area
    const firstArea = await this.generateArea(basePrompt);
    areas.push(firstArea);

    // Generate additional connected areas
    for (let i = 1; i < count; i++) {
      // Modify the prompt to ensure connection to existing areas
      const connectedPrompt: AreaGenerationPrompt = {
        ...basePrompt,
        additionalDetails: `${basePrompt.additionalDetails || ""} 
          This area should connect to "${
            areas[i - 1].name
          }" and maintain the overall theme and mood.
          Position this area relative to the previous one.`,
      };

      const newArea = await this.generateArea(connectedPrompt);

      // Ensure the new area is positioned near the previous one
      const prevPosition = areas[i - 1].position;
      const distance = 100 + Math.random() * 100; // Random distance between 100-200 units
      const angle = Math.random() * Math.PI * 2; // Random angle

      // Calculate new position based on distance and angle from previous area
      newArea.position = new Position({
        x: prevPosition.x + Math.cos(angle) * distance,
        y: prevPosition.y + Math.sin(angle) * distance,
        z: prevPosition.z + (Math.random() - 0.5) * 50, // Small random change in elevation
      });

      areas.push(newArea);
    }

    return areas;
  }
}
