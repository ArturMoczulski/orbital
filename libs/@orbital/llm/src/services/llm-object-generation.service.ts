import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ZodSchema } from "zod";

/**
 * Options for generating objects using LLMs
 */
export interface LLMObjectGenerationOptions {
  /** Maximum number of retries for LLM generation */
  maxRetries?: number;
  /** Whether to log errors during generation */
  logErrors?: boolean;
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
export class LLMObjectGenerationService {
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
  async generateObject<T>(
    schema: ZodSchema<T>,
    buildMessages: (retryCount: number) => LLMPromptMessages,
    retryCount: number = 0
  ): Promise<T> {
    // Create a structured output parser with the schema
    const parser = StructuredOutputParser.fromZodSchema(schema);

    // Get the format instructions
    const formatInstructions = parser.getFormatInstructions();

    // Build the messages for this attempt
    const { system, human } = buildMessages(retryCount);

    // Add format instructions and raw JSON reminder to the human message
    const messageWithInstructions = new HumanMessage(
      `${human.content}\n\n${formatInstructions}\n\n` +
        "IMPORTANT: Your response must be a valid JSON object WITHOUT any markdown formatting. " +
        "Do not use ```json code blocks or any other markdown. Return ONLY the raw JSON object."
    );

    try {
      // Generate the object data using the LLM
      const response = await this.model.invoke([
        system,
        messageWithInstructions,
      ]);

      // Parse the response using the structured output parser
      const result = await parser.parse(response.content);

      // Return the parsed result
      return result;
    } catch (error) {
      // Log the error if enabled
      if (this.logErrors) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        if (error instanceof Error) {
          console.error(`Error message: ${error.message}`);
        }
      }

      // Check if we've reached the maximum number of retries
      if (retryCount >= this.maxRetries - 1) {
        throw new Error(
          `Failed to generate valid object after ${this.maxRetries} attempts. The LLM did not produce a response that matches the required schema.`
        );
      }

      // Retry with an incremented retry count
      return this.generateObject(schema, buildMessages, retryCount + 1);
    }
  }
}
