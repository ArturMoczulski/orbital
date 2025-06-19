import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Logger } from "@orbital/core";
import { LLMObjectGenerationService, LLMPromptMessages } from "@orbital/llm";
import { ObjectGenerator } from "./object-generator";
import {
  MapGenerationInputSchema,
  MapGenerationPrompt,
  AreaMap,
  AreaMapSchema,
  AreaMapProps,
} from "@orbital/core";

/**
 * Class for generating game area maps using LLMs
 */
export class AreaMapGenerator extends ObjectGenerator<
  AreaMap,
  MapGenerationPrompt
> {
  /**
   * Creates a new AreaMapGenerator instance
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
   */
  inputSchema() {
    return MapGenerationInputSchema;
  }

  /**
   * Returns the Zod schema for output validation
   */
  schema() {
    return AreaMapSchema;
  }

  /**
   * Returns an example map instance for this generator
   */
  example(): AreaMap {
    return AreaMap.mock();
  }

  /**
   * Builds the LLM prompt for map generation
   * @param promptData The prompt data to use
   * @param retryCount Current retry count
   */
  protected instructions(
    promptData: MapGenerationPrompt,
    retryCount: number = 0
  ): LLMPromptMessages {
    const systemContent =
      "You are a creative video game map designer. Generate game area maps in a text-based intermediate representation (IR) that includes a legend and grid of symbols.";
    const humanContent = `Generate a map in JSON IR format based on the following parameters, ensuring the grid has ${promptData.height} rows and each row has ${promptData.width} characters:`;

    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(humanContent),
    };
  }

  /**
   * Generates a new AreaMap domain instance based on the provided prompt
   * @param promptData Prompt parameters for map generation
   */
  async generate(promptData: MapGenerationPrompt): Promise<AreaMap> {
    const raw = await super.generate(promptData);
    return new AreaMap(raw as AreaMapProps);
  }
}
