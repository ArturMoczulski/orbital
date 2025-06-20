/* libs/@orbital/llm/src/runnables/area-metadata-generation.runnable.ts */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Logger } from "@orbital/core";
import {
  AreaGenerationInputSchema,
  GeneratedAreaSchema,
  GeneratedAreaData,
} from "@orbital/world-builder/src/generators";
import { z } from "zod";
import {
  ObjectGenerationRunnable,
  ObjectGenerationRunnableOptions,
} from "./object-generation.runnable";

// Infer the AreaGenerationPrompt type from the schema
type AreaGenerationPrompt = z.infer<typeof AreaGenerationInputSchema>;

/**
 * Options for AreaMetadataGenerationRunnable
 */
export interface AreaMetadataGenerationRunnableOptions
  extends ObjectGenerationRunnableOptions<
    AreaGenerationPrompt,
    GeneratedAreaData
  > {
  // No additional options needed at this time, as inputSchema, outputSchema, and systemPrompt are handled by the base class
}

/**
 * Default system prompt for area generation
 */
const DEFAULT_AREA_SYSTEM_PROMPT = `You are a creative video game world designer. Generate detailed areas for video games.

Your task is to create a rich, detailed area description that would fit in a video game world.
Include a name, description, notable landmarks, and connections to other areas.
Make the area feel alive and interesting, with distinctive features that players would remember.`;

/**
 * Runnable for generating area metadata using LLMs
 */
export class AreaMetadataGenerationRunnable extends ObjectGenerationRunnable<
  AreaGenerationPrompt,
  GeneratedAreaData
> {
  // Store the logger for use in invoke
  /**
   * Creates a new AreaMetadataGenerationRunnable
   *
   * @param options Options for the runnable
   */
  constructor(options: AreaMetadataGenerationRunnableOptions) {
    // Call super first before accessing this
    super({
      inputSchema: AreaGenerationInputSchema as any, // Use type assertion to bypass type checking
      outputSchema: GeneratedAreaSchema,
      model: options.model,
      systemPrompt: DEFAULT_AREA_SYSTEM_PROMPT,
      maxAttempts: options.maxAttempts,
      messageHistoryStore: options.messageHistoryStore,
      logger: options.logger,
      inputData: options.inputData,
    });
  }
}
