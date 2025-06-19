import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ZodSchema } from "zod";
import { AbstractService, Logger, ConsoleLogger } from "@orbital/core";
import { GenerationResult } from "../types";

/**
 * Options for generating objects using LLMs
 */
export interface LLMObjectGenerationOptions {
  /** Maximum number of retries for LLM generation */
  maxRetries?: number;
  /** Whether to log errors during generation */
  logErrors?: boolean;
  /** Logger to use for logging */
  logger?: Logger;
}

/**
 * Message configuration for LLM prompts
 */
export interface LLMPromptMessages {
  /** System message to set the context for the LLM */
  system: SystemMessage;
  /** Human message containing the specific prompt */
  human: HumanMessage;
}

/**
 * Service for generating structured objects using LLMs
 */
export class LLMObjectGenerationService extends AbstractService {
  private maxRetries: number;
  private logErrors: boolean;
  private model: BaseLanguageModel;

  /**
   * Creates a new LLMObjectGenerationService
   * @param model The language model to use for generation
   * @param options Configuration options
   */
  constructor(
    model: BaseLanguageModel,
    options: LLMObjectGenerationOptions = {}
  ) {
    super(options.logger || new ConsoleLogger());

    this.model = model;
    this.maxRetries = options.maxRetries ?? 5;
    this.logErrors = options.logErrors ?? true;
  }

  /**
   * Generates an object using the provided schema and messages
   * @param schema Zod schema for validating and parsing the LLM output
   * @param buildMessages Function to build system and human messages
   * @param retryCount Current retry count (used internally)
   * @returns A Promise resolving to the generated object
   */
  /**
   * Generates an object using the provided schema and messages
   * @param schema Zod schema for validating and parsing the LLM output
   * @param buildMessages Function to build system and human messages
   * @param retryCount Current retry count (used internally)
   * @returns A Promise resolving to the generation result containing the generated object and prompt
   */
  async generateObject<T>(
    schema: ZodSchema<T>,
    buildMessages: (retryCount: number) => LLMPromptMessages,
    example?: T,
    retryCount: number = 0
  ): Promise<GenerationResult<T>> {
    // Create a structured output parser with the schema
    const parser = StructuredOutputParser.fromZodSchema(schema);

    // Get the format instructions
    const formatInstructions = parser.getFormatInstructions();

    // Build the messages for this attempt
    const { system, human } = buildMessages(retryCount);

    // Start with the human content
    let enhancedContent = human.content as string;

    // Add example if provided
    if (example) {
      const exampleJson = JSON.stringify(example, null, 2);
      enhancedContent += `\n\nHere is an example of a valid response:\n\n${exampleJson}`;
    }

    // Add format instructions and raw JSON reminder
    enhancedContent +=
      `\n\n${formatInstructions}\n\n` +
      "IMPORTANT: Your response must be a valid JSON object WITHOUT any markdown formatting. " +
      "Do not use ```json code blocks or any other markdown. Return ONLY the raw JSON object.";

    // Create the enhanced message
    const messageWithInstructions = new HumanMessage(enhancedContent);

    // Construct the full prompt for logging and returning
    const fullPrompt = `SYSTEM: ${system.content}\n\nHUMAN: ${messageWithInstructions.content}`;

    // Log the prompt
    this.logger.verbose(
      `LLM Prompt (Attempt ${retryCount + 1}):\n${fullPrompt}`
    );

    try {
      // Generate the object data using the LLM
      const response = await this.model.invoke([
        system,
        messageWithInstructions,
      ]);

      // Parse the response using the structured output parser
      const result = await parser.parse(response.content);

      // Log the response
      this.logger.verbose(
        `LLM Response (Attempt ${retryCount + 1}):\n${response.content}`
      );

      // Return the parsed result and prompt
      return {
        output: result,
        prompt: fullPrompt,
      };
    } catch (error) {
      // Log the error if enabled
      if (this.logErrors) {
        this.logger.verbose(`Attempt ${retryCount + 1} failed:`, error);
        if (error instanceof Error) {
          this.logger.verbose(`Error message: ${error.message}`);
        }
      }

      // Check if we've reached the maximum number of retries
      if (retryCount >= this.maxRetries - 1) {
        throw new Error(
          `Failed to generate valid object after ${this.maxRetries} attempts. The LLM did not produce a response that matches the required schema.`
        );
      }

      // Retry with an incremented retry count
      return this.generateObject(
        schema,
        buildMessages,
        example,
        retryCount + 1
      );
    }
  }
}
