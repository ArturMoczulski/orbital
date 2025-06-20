/* libs/@orbital/llm/src/runnables/object-generation.runnable.ts */

import { ZodSchema } from "zod";
import type { Logger } from "@orbital/core";
import {
  Runnable,
  RunnableConfig,
  RunnableRetry,
  RunnableSequence,
} from "@langchain/core/runnables";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { OutputFixingParser } from "langchain/output_parsers";
import {
  InMemoryChatMessageHistory,
  BaseChatMessageHistory,
} from "@langchain/core/chat_history";
import { GenerationResult } from "../types";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

// Factory function for creating a RunnableRetry
// This allows us to mock it in tests
export const createRunnableRetry = <T, U>(
  runnable: Runnable<T, U>,
  options: {
    stopAfterAttempt: number;
    onFailedAttempt?: (error: Error, attemptNumber: number) => void;
  }
) => {
  // In a real implementation, this would use withRetry
  // But for simplicity and to avoid test issues, we'll implement a simple retry mechanism
  return {
    invoke: async (input: any, config?: RunnableConfig) => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= options.stopAfterAttempt; attempt++) {
        try {
          return await runnable.invoke(input, config);
        } catch (error) {
          lastError = error as Error;
          if (options.onFailedAttempt) {
            options.onFailedAttempt(lastError, attempt);
          }
        }
      }

      // If we've exhausted all attempts, throw the last error
      if (lastError) {
        throw lastError;
      }

      // This should never happen, but TypeScript requires a return value
      throw new Error("Retry failed for unknown reason");
    },
  };
};

/* ------------------------------------------------------------ */
/* ------------------------------------------------------------ */

/* Interfaces                                                   */
/* ------------------------------------------------------------ */

export interface ObjectGenerationRunnableOptions<Out> {
  schema: ZodSchema<Out>;
  model: BaseLanguageModel;
  systemPrompt: string;
  maxAttempts?: number;
  messageHistoryStore?: (sessionId: string) => BaseChatMessageHistory;
  /** Optional logger for verbose prompt and debug response logging */
  logger?: Logger;
}

/* ------------------------------------------------------------ */
/* Runnable                                                     */
/* ------------------------------------------------------------ */

export class ObjectGenerationRunnable<In, Out> extends Runnable<
  In,
  GenerationResult<Out>
> {
  private readonly schema: ZodSchema<Out>;
  private readonly model: BaseLanguageModel;
  private readonly systemPrompt: string;
  private readonly maxAttempts: number;
  private readonly messageHistoryStore: (id: string) => BaseChatMessageHistory;
  private readonly inMemoryHistories = new Map<
    string,
    InMemoryChatMessageHistory
  >();

  // Components for generation
  private readonly parser: StructuredOutputParser<any>;
  private readonly fixingParser: any; // OutputFixingParser
  private readonly logger?: Logger;

  lc_namespace = ["orbital", "object-generation"];

  constructor(opts: ObjectGenerationRunnableOptions<Out>) {
    super();

    this.schema = opts.schema;
    this.model = opts.model;
    this.systemPrompt = opts.systemPrompt;
    this.maxAttempts = opts.maxAttempts ?? 3;
    this.logger = opts.logger;

    /* ---------- History backend ---------- */
    this.messageHistoryStore =
      opts.messageHistoryStore ??
      ((sid) => {
        if (!this.inMemoryHistories.has(sid)) {
          this.inMemoryHistories.set(sid, new InMemoryChatMessageHistory());
        }
        return this.inMemoryHistories.get(sid)!;
      });

    /* ---------- Parsers ---------- */
    this.parser = StructuredOutputParser.fromZodSchema(this.schema);
    this.fixingParser = OutputFixingParser.fromLLM(this.model, this.parser);
  }

  /**
   * Extract the raw message content from various response types
   */
  protected extractContent(response: BaseMessage): string {
    if (response instanceof AIMessage) {
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    } else if (typeof response === "string") {
      return response;
    } else if (response && typeof response.content === "string") {
      return response.content;
    } else if (response) {
      try {
        const stringified = JSON.stringify(response);
        const parsed = JSON.parse(stringified);
        // Serialized AIMessage
        if (
          parsed.invoke &&
          parsed.invoke.kwargs &&
          typeof parsed.invoke.kwargs.content === "string"
        ) {
          return parsed.invoke.kwargs.content;
        }
        // Direct content
        if (parsed.content && typeof parsed.content === "string") {
          return parsed.content;
        }
        return stringified;
      } catch {
        return String(response);
      }
    }
    return "";
  }

  /**
   * Parse the content string into the expected output type
   * Handles parsing errors with fallbacks and test-specific behavior
   */
  protected async parseContent(
    content: string,
    capturedPrompt: string
  ): Promise<GenerationResult<Out>> {
    // Parse the response
    let parsedOutput: any;
    try {
      // First try direct parsing
      parsedOutput = await this.parser.parse(content);
    } catch (parseError: unknown) {
      console.warn(
        "Direct parsing failed:",
        parseError instanceof Error ? parseError.message : String(parseError)
      );

      try {
        // If direct parsing fails, use the fixing parser
        parsedOutput = await this.fixingParser.parse(content);
      } catch (fixingError: unknown) {
        console.warn(
          "Fixing parser failed:",
          fixingError instanceof Error
            ? fixingError.message
            : String(fixingError)
        );

        // Last resort - try to extract JSON from the content
        try {
          // Try to find any JSON-like structure in the content
          const jsonMatch = content.match(/\{.*\}/);
          if (jsonMatch) {
            const extracted = jsonMatch[0];
            parsedOutput = JSON.parse(extracted);

            // Validate against schema
            const validation = this.schema.safeParse(parsedOutput);
            if (!validation.success) {
              throw new Error("Extracted JSON doesn't match schema");
            }
          } else {
            throw new Error("No JSON found in content");
          }
        } catch (e) {
          // If all parsing attempts fail, re-throw the original error
          throw fixingError;
        }
      }
    }

    // Return the result
    return {
      output: parsedOutput as Out,
      prompt: capturedPrompt,
    };
  }

  /**
   * Generate prompt messages for the LLM
   * Builds system, history, and human messages and captures the prompt for logging
   */
  protected async generatePromptMessages(
    input: In,
    sessionId: string,
    useHistory: boolean
  ): Promise<{ messages: BaseMessage[]; capturedPrompt: string }> {
    // Format the input
    const formattedInput = JSON.stringify(input, null, 2);
    const formatInstructions = this.parser.getFormatInstructions();

    // Get history if enabled
    const historyMessages =
      sessionId && useHistory
        ? await this.messageHistoryStore(sessionId).getMessages()
        : [];

    // Build messages array
    const messages: BaseMessage[] = [
      new SystemMessage(`${this.systemPrompt}\n\n${formatInstructions}`),
      ...historyMessages,
      new HumanMessage(
        [
          "Given the following input, generate an object that **strictly** matches the schema above.",
          "",
          "INPUT:",
          formattedInput,
          "",
          "IMPORTANT: Return **ONLY** raw JSON (no markdown).",
        ].join("\n")
      ),
    ];

    // Capture the prompt for debugging/testing
    const capturedPrompt = messages
      .map((m) => {
        if (m instanceof SystemMessage) return `SYSTEM: ${m.content}`;
        if (m instanceof HumanMessage) return `HUMAN: ${m.content}`;
        if (m instanceof AIMessage) return `AI: ${m.content}`;
        return `MESSAGE: ${m.content}`;
      })
      .join("\n\n");

    if (this.logger) {
      this.logger.verbose(capturedPrompt);
    }

    return { messages, capturedPrompt };
  }

  /**
   * Process the LLM response
   * Handles logging, history storage, content extraction, and parsing
   */
  protected async processModelResponse(
    response: BaseMessage,
    sessionId: string,
    useHistory: boolean,
    capturedPrompt: string
  ): Promise<GenerationResult<Out>> {
    // Store in history if enabled
    if (sessionId && useHistory && response instanceof AIMessage) {
      this.messageHistoryStore(sessionId).addMessage(response);
    }

    // Extract content from the response
    const content = this.extractContent(response);

    const parsed = await this.parseContent(content, capturedPrompt);

    // Log the extracted message content
    if (this.logger) {
      this.logger.debug(`LLM response:`, parsed);
    }

    return parsed;
  }

  /**
   * Create and execute a runnable sequence with retry logic
   */
  protected createAndExecuteSequence(
    generateMessages: () => Promise<BaseMessage[]>,
    processResponse: (response: BaseMessage) => Promise<GenerationResult<Out>>,
    config?: RunnableConfig
  ): Promise<GenerationResult<Out>> {
    // Create a runnable sequence that:
    // 1. Generates messages
    // 2. Invokes the model
    // 3. Processes the response
    const generateSequence = RunnableSequence.from([
      generateMessages,
      this.model,
      processResponse,
    ]);

    // Wrap the sequence with retry logic using the factory function
    const retrySequence = createRunnableRetry(generateSequence, {
      stopAfterAttempt: this.maxAttempts,
      onFailedAttempt: (error: Error, attemptNumber: number) => {
        console.warn(
          `Attempt ${attemptNumber}/${this.maxAttempts} failed:`,
          error instanceof Error ? error.message : error
        );
      },
    });

    // Execute the retry sequence
    return retrySequence.invoke(null, config);
  }

  /* -------------------------------------------------------- */
  /* Public methods                                           */
  /* -------------------------------------------------------- */
  async invoke(
    input: In,
    config?: RunnableConfig
  ): Promise<GenerationResult<Out>> {
    if (!config?.configurable?.sessionId) {
      throw new Error("config.configurable.sessionId is required");
    }

    let capturedPrompt = "";
    const sessionId = config.configurable.sessionId as string;
    const useHistory = config.configurable.useHistory !== false;

    // Create a function to generate the messages
    const generateMessages = async () => {
      const result = await this.generatePromptMessages(
        input,
        sessionId,
        useHistory
      );
      capturedPrompt = result.capturedPrompt;
      return result.messages;
    };

    // Create a function to process the model response
    const processResponse = async (response: BaseMessage) => {
      return this.processModelResponse(
        response,
        sessionId,
        useHistory,
        capturedPrompt
      );
    };

    // Create and execute the generation sequence with retry
    return this.createAndExecuteSequence(
      generateMessages,
      processResponse,
      config
    );
  }

  async batch(
    inputs: In[],
    configs?: RunnableConfig[] | RunnableConfig
  ): Promise<GenerationResult<Out>[]> {
    const cfgs = Array.isArray(configs)
      ? configs
      : inputs.map(() => configs as RunnableConfig | undefined);
    const out: GenerationResult<Out>[] = [];
    for (let i = 0; i < inputs.length; i++) {
      out.push(await this.invoke(inputs[i], cfgs[i]));
    }
    return out;
  }

  /* ---------- History helpers ---------- */

  clearHistory(sessionId: string) {
    this.messageHistoryStore(sessionId).clear();
  }

  clearAllHistories() {
    this.inMemoryHistories.forEach((h) => h.clear());
  }
}
