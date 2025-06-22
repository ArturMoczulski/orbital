import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { CompositeObjectGenerationRunnable } from "@orbital/llm";
import {
  AreaGenerationInputSchema,
  AreaGenerationInputProps,
} from "./area-generation-input";
import { promptRepository } from "../object-generation-prompt-repository";
import { Area } from "@orbital/core";

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
  rootInput: Partial<AreaGenerationInputProps>,
  nestedInputs: Record<string, any> = {},
  verbose = false
): Promise<Area> {
  const validatedRootInput = AreaGenerationInputSchema.parse(rootInput);
  const runnable = new CompositeObjectGenerationRunnable(Area, {
    // @ts-ignore: allow BaseLanguageModel without private internals
    model,
    promptRepository,
    inputSchema: AreaGenerationInputSchema,
  });

  return runnable.invoke(validatedRootInput, nestedInputs, { verbose });
}
