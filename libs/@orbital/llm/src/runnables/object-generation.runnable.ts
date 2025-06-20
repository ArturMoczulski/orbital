import { ZodSchema } from "zod";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { OutputFixingParser } from "langchain/output_parsers";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { GenerationResult } from "../types";

/**
 * Options for the ObjectGenerationRunnable
 */
export interface ObjectGenerationRunnableOptions<Out> {
  /** Zod schema for the output object */
  schema: ZodSchema<Out>;
  /** LangChain language model (ChatOpenAI, ChatOllama, etc.) */
  model: BaseLanguageModel;
  /** System prompt to set the context for the LLM */
  systemPrompt: string;
  /** Maximum number of retry attempts for generation */
  maxAttempts?: number;
  /** Custom message history store (defaults to in-memory) */
  messageHistoryStore?: (sessionId: string) => BaseChatMessageHistory;
}

/**
 * A runnable that generates objects based on a Zod schema
 *
 * Features:
 * - Schema-driven prompting and validation
 * - Optional conversation history
 * - Provider-agnostic (works with any LangChain language model)
 * - Automatic retry on errors
 * - Automatic fixing of validation errors
 */
export class ObjectGenerationRunnable<In, Out> extends Runnable<
  In,
  GenerationResult<Out>
> {
  private readonly schema: ZodSchema<Out>;
  private readonly model: BaseLanguageModel;
  private readonly systemPrompt: string;
  private readonly maxAttempts: number;
  private readonly messageHistoryStore: (
    sessionId: string
  ) => BaseChatMessageHistory;
  private readonly inMemoryHistories: Map<string, InMemoryChatMessageHistory> =
    new Map();

  // Required by Runnable
  lc_namespace = ["orbital", "object-generation"];

  /**
   * Creates a new ObjectGenerationRunnable
   *
   * @param options Configuration options
   */
  constructor(options: ObjectGenerationRunnableOptions<Out>) {
    super();

    this.schema = options.schema;
    this.model = options.model;
    this.systemPrompt = options.systemPrompt;
    this.maxAttempts = options.maxAttempts ?? 3;

    // Set up message history store
    if (options.messageHistoryStore) {
      this.messageHistoryStore = options.messageHistoryStore;
    } else {
      this.messageHistoryStore = (sessionId: string) => {
        if (!this.inMemoryHistories.has(sessionId)) {
          this.inMemoryHistories.set(
            sessionId,
            new InMemoryChatMessageHistory()
          );
        }
        return this.inMemoryHistories.get(sessionId)!;
      };
    }
  }

  /**
   * Invoke the runnable with the given input
   *
   * @param input The input to the runnable
   * @param config Configuration for this invocation
   * @returns A Promise resolving to the generation result
   */
  async invoke(
    input: In,
    config?: RunnableConfig
  ): Promise<GenerationResult<Out>> {
    // Ensure we have a session ID
    if (!config?.configurable?.sessionId) {
      throw new Error(
        "Session ID is required in config.configurable.sessionId"
      );
    }

    // Get session ID and history settings
    const sessionId = config.configurable.sessionId;
    const useHistory = config.configurable.useHistory !== false;

    // Get message history
    const history = this.messageHistoryStore(sessionId);
    const historyMessages = useHistory ? await history.getMessages() : [];

    // Create the structured output parser
    const structuredOutputParser = StructuredOutputParser.fromZodSchema(
      this.schema
    );

    // Create the output fixing parser
    const outputParser = OutputFixingParser.fromLLM(
      this.model,
      structuredOutputParser
    );

    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.systemPrompt],
      ...historyMessages,
      [
        "human",
        `Given the following input, generate an object that **strictly** matches the schema below.\n\n` +
          `INPUT:\n${JSON.stringify(input, null, 2)}\n\n` +
          `### BEGIN FORMAT INSTRUCTIONS\n${structuredOutputParser.getFormatInstructions()}\n### END FORMAT INSTRUCTIONS\n\n` +
          `IMPORTANT: Your response must be a valid JSON object WITHOUT any markdown formatting. ` +
          `Do not use \`\`\`json code blocks or any other markdown. Return ONLY the raw JSON object.`,
      ],
    ]);

    // Implement retry logic
    let result: Out | null = null;
    let lastError: Error | null = null;
    let fullPrompt = "";

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        // Format messages
        const messages = await prompt.formatMessages({});

        // Save the full prompt for returning in the result
        fullPrompt = messages
          .map((m) => `${m._getType().toUpperCase()}: ${m.content}`)
          .join("\n\n");

        // Invoke the model
        const response = await this.model.invoke(messages);

        // Parse the response with automatic fixing
        result = await outputParser.parse(response.content as string);

        // Add the human and AI messages to history if useHistory is true
        if (useHistory) {
          const humanMessage = messages[messages.length - 1];
          if (humanMessage instanceof HumanMessage) {
            await history.addMessage(humanMessage);
          }
          await history.addMessage(response);
        }

        // Success, break out of retry loop
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this was the last attempt, we'll throw the error after the loop
        if (attempt === this.maxAttempts) {
          break;
        }

        // Wait before retrying (simple exponential backoff)
        const backoffMs = Math.min(100 * Math.pow(2, attempt - 1), 3000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    if (!result) {
      throw (
        lastError ||
        new Error(
          `Failed to generate valid object after ${this.maxAttempts} attempts`
        )
      );
    }

    return {
      output: result,
      prompt: fullPrompt,
    };
  }

  /**
   * Batch invoke the runnable with the given inputs
   *
   * @param inputs The inputs to the runnable
   * @param configs Configuration for this invocation
   * @param options Batch options
   * @returns A Promise resolving to an array of generation results
   */
  async batch(
    inputs: In[],
    configs?: RunnableConfig[] | RunnableConfig,
    options?: { maxConcurrency?: number }
  ): Promise<GenerationResult<Out>[]> {
    // Process each input sequentially
    const results: GenerationResult<Out>[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const config = Array.isArray(configs) ? configs[i] : configs;

      results.push(await this.invoke(input, config));
    }

    return results;
  }

  /**
   * Clear the message history for a session
   *
   * @param sessionId The session ID to clear history for
   */
  clearHistory(sessionId: string): void {
    const history = this.messageHistoryStore(sessionId);
    history.clear();
  }

  /**
   * Clear all message histories (only works for in-memory histories)
   */
  clearAllHistories(): void {
    this.inMemoryHistories.forEach((history) => {
      history.clear();
    });
  }
}
