import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ZodSchema, ZodError } from "zod";
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
 * Options for a specific object generation request
 */
export interface GenerateObjectOptions {
  /** Whether to preserve assistant responses in the conversation history */
  preserveResponses?: boolean;
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
  private accumulatedIssues: Record<string, any>[] = [];
  private assistantResponses: AIMessage[] = [];

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
  /**
   * Generates an object using the provided schema and messages
   * @param schema Zod schema for validating and parsing the LLM output
   * @param buildMessages Function to build system and human messages
   * @param example Optional example object to include in the prompt
   * @param retryCount Current retry count (used internally)
   * @param previousIssues Previous validation issues (used internally)
   * @param options Generation options for this specific request
   * @returns A Promise resolving to the generation result containing the generated object and prompt
   */
  async generateObject<T>(
    schema: ZodSchema<T>,
    buildMessages: (retryCount: number) => LLMPromptMessages,
    example?: T,
    retryCount: number = 0,
    previousIssues: Record<string, any>[] = [],
    options: GenerateObjectOptions = {}
  ): Promise<GenerationResult<T>> {
    // Initialize accumulated issues with previous issues on first call
    if (retryCount === 0) {
      this.accumulatedIssues = [...previousIssues];
      // Reset assistant responses when starting a new generation
      if (!options.preserveResponses) {
        this.assistantResponses = [];
      }
    }

    // Create parser and get format instructions
    const parser = StructuredOutputParser.fromZodSchema(schema);
    const formatInstructions = parser.getFormatInstructions();

    // Build and format messages
    const { formattedSystem, messageWithInstructions, fullPrompt } =
      this.buildFormattedMessages(
        buildMessages,
        retryCount,
        formatInstructions,
        example,
        options
      );

    // Log the prompt
    this.logger.verbose(
      `LLM Prompt (Attempt ${retryCount + 1}):\n${fullPrompt}`
    );

    try {
      // Invoke model and parse response
      const result = await this.invokeModelAndParseResponse(
        formattedSystem,
        messageWithInstructions,
        parser,
        retryCount,
        options,
        buildMessages
      );

      // Return the parsed result and prompt
      return {
        output: result as T,
        prompt: fullPrompt,
      };
    } catch (error) {
      // Handle generation error
      return this.handleGenerationError(
        error,
        schema,
        buildMessages,
        retryCount,
        example,
        options
      );
    }
  }

  /**
   * Builds and formats the system and human messages
   * @param buildMessages Function to build messages
   * @param retryCount Current retry count
   * @param formatInstructions Format instructions for the schema
   * @param example Optional example object to include in the prompt
   * @returns Formatted system and human messages, and the full prompt
   */
  protected buildFormattedMessages<T>(
    buildMessages: (retryCount: number) => LLMPromptMessages,
    retryCount: number,
    formatInstructions: string,
    example?: T,
    options: GenerateObjectOptions = {}
  ) {
    // Build the messages for this attempt
    const { system: baseSystem, human } = buildMessages(retryCount);

    // Append format instructions to system message
    const formattedSystem = new SystemMessage(
      `${baseSystem.content}\n\n${formatInstructions}`
    );

    // Enhance human content if this is the first attempt
    let enhancedContent = human.content as string;
    if (retryCount === 0) {
      enhancedContent = this.enhanceHumanContent(enhancedContent, example);
    }

    // Create the message to send
    const messageWithInstructions =
      retryCount === 0 ? new HumanMessage(enhancedContent) : human;

    // Construct the full prompt for logging and returning
    let fullPrompt = `SYSTEM: ${formattedSystem.content}\n\nHUMAN: ${messageWithInstructions.content}`;

    return { formattedSystem, messageWithInstructions, fullPrompt };
  }

  /**
   * Builds the complete message array including system, human, and optionally assistant messages
   * @param system System message
   * @param human Human message
   * @param options Generation options
   * @returns Array of messages to send to the model, including previous assistant responses if preserveResponses is true
   */
  protected buildMessageArray(
    system: SystemMessage,
    human: HumanMessage,
    options: GenerateObjectOptions = {}
  ) {
    const messages = [system];

    // If preserveResponses is true and we have assistant responses,
    // add them to the conversation
    if (options.preserveResponses && this.assistantResponses.length > 0) {
      // First add the human message
      messages.push(human);

      // Then add all assistant responses
      for (const response of this.assistantResponses) {
        messages.push(response);
      }
    } else {
      // If not preserving responses, just add the human message
      messages.push(human);
    }

    return messages;
  }

  /**
   * Enhances the human message content with examples and formatting instructions
   * @param content Original human message content
   * @param example Optional example object to include
   * @returns Enhanced human message content
   */
  protected enhanceHumanContent<T>(content: string, example?: T): string {
    let enhancedContent = content;

    // Add example if provided
    if (example) {
      const exampleJson = JSON.stringify(example, null, 2);
      enhancedContent += `\n\nHere is an example of a valid response:\n\n${exampleJson}`;
    }

    // Add the raw JSON reminder
    enhancedContent +=
      "\n\nIMPORTANT: Your response must be a valid JSON object WITHOUT any markdown formatting. " +
      "Do not use ```json code blocks or any other markdown. Return ONLY the raw JSON object.";

    return enhancedContent;
  }

  /**
   * Invokes the model and parses the response
   * @param formattedSystem Formatted system message
   * @param messageWithInstructions Human message with instructions
   * @param parser Structured output parser
   * @param retryCount Current retry count
   * @returns Parsed result
   */
  protected async invokeModelAndParseResponse<T>(
    formattedSystem: SystemMessage,
    messageWithInstructions: HumanMessage,
    parser: any,
    retryCount: number,
    options: GenerateObjectOptions = {},
    buildMessages?: (retryCount: number) => LLMPromptMessages
  ): Promise<unknown> {
    // Generate the object data using the LLM
    const messages = this.buildMessageArray(
      formattedSystem,
      messageWithInstructions,
      options
    );

    const response = await this.model.invoke(messages);

    // Store the assistant response if we're preserving responses
    if (options.preserveResponses) {
      if (response instanceof AIMessage) {
        this.assistantResponses.push(response);
      } else {
        // If response is not an AIMessage, convert it to one
        this.assistantResponses.push(
          new AIMessage({ content: response.content })
        );
      }
    }

    // Parse the response using the structured output parser
    const result = await parser.parse(response.content);

    // Log the response
    const attemptNumber = retryCount + 1;
    const logMessage = `LLM Response (Attempt ${attemptNumber.toString()}):\n${
      response.content
    }`;
    this.logger.verbose(logMessage);

    return result;
  }

  /**
   * Handles errors during generation
   * @param error Error that occurred
   * @param schema Schema for validation
   * @param buildMessages Function to build messages
   * @param example Optional example object
   * @param retryCount Current retry count
   * @returns Generation result from retry
   */
  protected handleGenerationError<T>(
    error: any,
    schema: ZodSchema<T>,
    buildMessages: (retryCount: number) => LLMPromptMessages,
    retryCount: number,
    example?: T,
    options: GenerateObjectOptions = {}
  ): Promise<GenerationResult<T>> {
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

    // Process validation issues if this is a ZodError
    this.processValidationIssues(error);

    // Build messages with feedback for the next retry
    const buildMessagesWithFeedback = this.createFeedbackMessageBuilder(
      buildMessages,
      error
    );

    // Retry with the new message builder
    return this.generateObject(
      schema,
      buildMessagesWithFeedback,
      example,
      retryCount + 1,
      this.accumulatedIssues,
      options
    );
  }

  /**
   * Processes validation issues from a ZodError
   * @param error Error to process
   * @returns Array of simplified validation issues
   */
  protected processValidationIssues(error: any): Record<string, any>[] {
    let newIssues: Record<string, any>[] = [];

    if (error instanceof ZodError && error.issues.length > 0) {
      // Process all validation issues
      newIssues = error.issues.map((issue) => {
        // Create a simplified object with only the essential properties
        const simplifiedIssue: Record<string, any> = {
          code: issue.code,
          path: issue.path,
          message: issue.message,
        };

        // Add type-specific properties that might exist on this specific issue type
        if ("expected" in issue) {
          simplifiedIssue.expected = (issue as any).expected;
        }
        if ("received" in issue) {
          simplifiedIssue.received = (issue as any).received;
        }

        return simplifiedIssue;
      });

      // Add new issues to accumulated issues
      this.accumulatedIssues = [...this.accumulatedIssues, ...newIssues];
    }

    return newIssues;
  }

  /**
   * Creates a message builder function that includes feedback from errors
   * @param buildMessages Original message builder function
   * @param error Error that occurred
   * @returns New message builder function with feedback
   */
  protected createFeedbackMessageBuilder(
    buildMessages: (retryCount: number) => LLMPromptMessages,
    error: any
  ): (retryCount: number) => LLMPromptMessages {
    return (nextRetryCount: number) => {
      const { system: prevSystem } = buildMessages(nextRetryCount);

      // Format the feedback based on the error type
      const feedback =
        error instanceof ZodError
          ? JSON.stringify(this.accumulatedIssues)
          : (error as Error).message;

      // Get the original human message content without any previous error feedback
      const originalContent = buildMessages(0).human.content as string;

      // Create a new human message with the original content plus accumulated feedback
      const enhancedContent = `${originalContent}\nYour previous response had errors:\n${feedback}`;

      return {
        system: prevSystem,
        human: new HumanMessage(enhancedContent),
      };
    };
  }
}
