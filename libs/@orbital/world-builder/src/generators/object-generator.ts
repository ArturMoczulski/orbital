import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage } from "@langchain/core/messages";
import { AbstractService, Logger } from "@orbital/core";
import { LLMObjectGenerationService, LLMPromptMessages } from "@orbital/llm";
import { z, ZodSchema } from "zod";

/**
 * Base Zod schema for input used by object generators
 */
export const ObjectGeneratorInputSchema = z
  .object({})
  .describe("Base input schema for object generators");

/**
 * Type for input schema used by object generators
 */
export type ObjectGeneratorInputProps = z.infer<
  typeof ObjectGeneratorInputSchema
>;

/**
 * Abstract base class for object generators
 * @template GenerationType The type of object this generator produces
 * @template InputSchema The type of input schema this generator uses
 */
export abstract class ObjectGenerator<
  GenerationType,
  InputSchema = ObjectGeneratorInputProps
> extends AbstractService {
  /**
   * Creates a new object generator
   * @param model The language model to use for generation
   * @param generationService The service to use for LLM object generation
   */
  constructor(
    protected model: BaseLanguageModel,
    protected generationService: LLMObjectGenerationService,
    logger: Logger
  ) {
    super(logger);
  }

  /**
   * Returns the Zod schema for input validation
   * @returns The Zod schema for input
   */
  abstract inputSchemaZ(): ZodSchema<any>;

  /**
   * Returns the default input schema values
   * @returns The default input schema
   */
  inputSchema(): InputSchema {
    // Create a default object based on the Zod schema
    return this.inputSchemaZ().parse({}) as InputSchema;
  }

  /**
   * Returns the Zod schema for output validation
   * @returns The Zod schema for output
   */
  abstract schema(): ZodSchema<any>;

  /**
   * Returns an example object for this generator
   * @returns An example object
   */
  abstract example(): any;

  /**
   * Builds the LLM prompt for generation
   * @param inputData The input data to use
   * @param retryCount Current retry count
   * @returns The built prompt messages
   */
  protected abstract instructions(
    inputData: InputSchema,
    retryCount?: number
  ): LLMPromptMessages;

  /**
   * Generates an object using the LLM
   * @param inputData The input data to use
   * @returns A Promise resolving to the generated object
   */
  async generate(inputData: Partial<InputSchema>): Promise<GenerationType> {
    // Validate and parse the input data using the Zod schema
    // This will fill in any missing fields with defaults from the schema
    const validatedInput = this.inputSchemaZ().parse(inputData);

    // Create a messages builder function that adds input data to the human message
    const messagesBuilder = (retryCount: number) => {
      // Get the base instructions
      const messages = this.instructions(validatedInput, retryCount);

      // Get the human message content
      const humanContent = messages.human.content as string;

      // Create a JSON string of the input data
      const inputDataString = JSON.stringify(validatedInput, null, 2);

      // Append the input data to the human message
      const enhancedHumanContent = `${humanContent}\n\nGuidance details:\n${inputDataString}`;

      // Create a new human message with the enhanced content
      const enhancedHumanMessage = new HumanMessage(enhancedHumanContent);

      // Return the messages with the enhanced human message
      return {
        system: messages.system,
        human: enhancedHumanMessage,
      };
    };

    // Call generateObject with the schema, messages builder, and example
    const result = await this.generationService.generateObject(
      this.schema(),
      messagesBuilder,
      this.example()
    );

    return result.output as GenerationType;
  }
}
