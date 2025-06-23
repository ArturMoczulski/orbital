import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { CompositeObjectGenerationRunnable } from "@orbital/llm";
import {
  AreaGenerationInputSchema,
  AreaGenerationInputProps,
} from "./area-generation-input";
import { promptRepository } from "../object-generation-prompt-repository";
import { Area, ConsoleLogger, VerbosityLevel } from "@orbital/core";

/**
 * Helper to generate an Area object and its nested parts.
 *
 * @param model       The LLM model to use (must implement BaseLanguageModel)
 * @param rootInput   The root Area input (id, name, areaMap)
 * @param nestedInputs Optional map of nested inputs keyed by JSON path
 * @param verbose     Whether to enable verbose logging
 * @returns Generated Area instance
 */
export async function generateArea(
  model: BaseLanguageModel,
  input: Partial<AreaGenerationInputProps> & Record<string, any>,
  config?: { verbose?: boolean }
): Promise<Area> {
  // Validate the root input properties
  const validatedRootInput = AreaGenerationInputSchema.parse(input);
  // Create a logger if verbose mode is enabled
  const logger = config?.verbose
    ? new ConsoleLogger(VerbosityLevel.DEBUG, "AreaGenerator")
    : undefined;
  const runnable = new CompositeObjectGenerationRunnable(Area, {
    // @ts-ignore: allow BaseLanguageModel without private internals
    model,
    promptRepository,
    inputSchema: AreaGenerationInputSchema,
    logger,
  });

  // Use the new single-input API
  return runnable.invoke(input, config);
}
