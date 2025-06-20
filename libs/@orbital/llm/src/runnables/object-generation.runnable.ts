/* libs/@orbital/llm/src/runnables/object-generation.runnable.ts */

import type { ZodSchema } from "zod";
import { VerbosityLevel, zodSchemaRegistry } from "@orbital/core";
import type { Logger } from "@orbital/core";

import {
  Runnable,
  RunnableConfig,
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
import { IObjectGenerationPromptRepository } from "./object-generation-prompt-repository.interface";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

// Factory for retry logic (mockable in tests)
export const createRunnableRetry = <T, U>(
  runnable: Runnable<T, U>,
  options: {
    stopAfterAttempt: number;
    onFailedAttempt?: (error: Error, attemptNumber: number) => void;
  }
) => ({
  invoke: async (input: any, config?: RunnableConfig) => {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= options.stopAfterAttempt; attempt++) {
      try {
        return await runnable.invoke(input, config);
      } catch (err) {
        lastError = err as Error;
        options.onFailedAttempt?.(lastError, attempt);
      }
    }
    if (lastError) throw lastError;
    throw new Error("Retry failed for unknown reason");
  },
});

export interface ObjectGenerationRunnableOptions<In, Out> {
  /** LLM model to use */
  model: BaseLanguageModel;
  /** Override or infer input schema */
  inputSchema?: ZodSchema<In>;
  /** Override or infer output schema */
  outputSchema?: ZodSchema<Out>;
  /** Override the Zod registry */
  schemaRegistry?: typeof zodSchemaRegistry;
  /** Prompt repository (optional if systemPrompt is provided) */
  promptRepository?: IObjectGenerationPromptRepository;
  /** Literal system prompt */
  systemPrompt?: string;
  /** Key lookup for system prompt */
  systemPromptKey?: string;
  /** Retry attempts */
  maxAttempts?: number;
  /** Chat history store factory */
  messageHistoryStore?: (sessionId: string) => BaseChatMessageHistory;
  /** Optional logger */
  logger?: Logger;
  /** Additional inputData embedded in prompt */
  inputData?: In;
}

export class ObjectGenerationRunnable<In, Out> extends Runnable<
  In,
  GenerationResult<Out>
> {
  private readonly inputSchema: ZodSchema<In>;
  private readonly outputSchema: ZodSchema<Out>;
  private readonly model: BaseLanguageModel;
  private readonly systemPrompt: string;
  private readonly maxAttempts: number;
  private readonly messageHistoryStore: (id: string) => BaseChatMessageHistory;
  private readonly inMemoryHistories = new Map<
    string,
    InMemoryChatMessageHistory
  >();
  protected readonly logger?: Logger;
  private readonly inputData?: In;

  private readonly parser: ReturnType<
    typeof StructuredOutputParser.fromZodSchema
  >;
  private readonly fixingParser: ReturnType<typeof OutputFixingParser.fromLLM>;

  lc_namespace = ["orbital", "object-generation"];

  constructor(
    /** Decorated type for inference */
    private readonly type: new (...args: any[]) => any,
    opts: ObjectGenerationRunnableOptions<In, Out>
  ) {
    super();
    // Registry & conventions
    const registry = opts.schemaRegistry ?? zodSchemaRegistry;
    const typeName = this.type.name ?? "";

    // Input schema
    const inSch =
      opts.inputSchema ??
      registry.get((globalThis as any)[`${typeName}GenerationInputSchema`]);

    if (!inSch) {
      throw new Error(`Input schema not found for type ${typeName}`);
    }

    // Output schema
    const outSch = opts.outputSchema ?? registry.get(this.type as object);

    if (!outSch) {
      throw new Error(`Output schema not found for type ${typeName}`);
    }

    // Prompt
    const promptRepo = opts.promptRepository;
    let sysPrompt = opts.systemPrompt;

    // If no direct system prompt, try to get it from the repository
    if (!sysPrompt && promptRepo) {
      if (opts.systemPromptKey) {
        sysPrompt = promptRepo.get(opts.systemPromptKey);
      } else if (typeName) {
        sysPrompt = promptRepo.get(promptRepo.inferKey(typeName));
      }
    }

    if (!sysPrompt) {
      throw new Error(`System prompt not provided`);
    }

    // History store
    const store =
      opts.messageHistoryStore ??
      ((sid: string) => {
        if (!this.inMemoryHistories.has(sid)) {
          this.inMemoryHistories.set(sid, new InMemoryChatMessageHistory());
        }
        return this.inMemoryHistories.get(sid)!;
      });

    // Assign
    this.inputSchema = inSch as ZodSchema<In>;
    this.outputSchema = outSch as ZodSchema<Out>;
    this.model = opts.model;
    this.systemPrompt = sysPrompt;
    this.maxAttempts = opts.maxAttempts ?? 3;
    this.logger = opts.logger;
    this.inputData = opts.inputData;
    this.messageHistoryStore = store;

    // Parsers
    this.parser = StructuredOutputParser.fromZodSchema(this.outputSchema);
    this.fixingParser = OutputFixingParser.fromLLM(this.model, this.parser);
  }

  protected extractContent(response: BaseMessage): string {
    if (response instanceof AIMessage) {
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    } else if (typeof response === "string") {
      return response;
    } else if (response && typeof (response as any).content === "string") {
      return (response as any).content;
    } else if (response) {
      try {
        const str = JSON.stringify(response);
        const parsed = JSON.parse(str);
        return parsed.invoke?.kwargs?.content ?? parsed.content ?? str;
      } catch {
        return String(response);
      }
    }
    return "";
  }

  protected async parseContent(
    content: string,
    capturedPrompt: string
  ): Promise<GenerationResult<Out>> {
    let parsed: any;
    try {
      parsed = await this.parser.parse(content);
    } catch {
      try {
        parsed = await this.fixingParser.parse(content);
      } catch {
        const match = content.match(/\{.*\}/);
        if (match) {
          const json = JSON.parse(match[0]);
          const val = this.outputSchema.safeParse(json);
          if (!val.success) throw new Error("Schema validation failed");
          parsed = json;
        } else {
          throw new Error("Unable to parse response");
        }
      }
    }
    return { output: parsed as Out, prompt: capturedPrompt };
  }

  protected async generatePromptMessages(
    input: In,
    sessionId: string,
    useHistory: boolean
  ) {
    const validated = this.inputSchema.parse(input);
    this.logger?.debug("Input validated:", validated);

    const humanLines = [
      "Given the following input, generate an object that **strictly** matches the schema above.",
      "",
      "INPUT:",
      JSON.stringify(validated, null, 2),
      "",
      "IMPORTANT: Return **ONLY** raw JSON (no markdown).",
    ];
    if (this.inputData !== undefined) {
      humanLines.push(
        "",
        "RAW INPUT DATA:",
        JSON.stringify(this.inputData, null, 2)
      );
    }

    const messages: BaseMessage[] = [
      new SystemMessage(
        `${this.systemPrompt}\n\n${this.parser.getFormatInstructions()}`
      ),
      ...(useHistory
        ? await this.messageHistoryStore(sessionId).getMessages()
        : []),
      new HumanMessage(humanLines.join("\n")),
    ];

    const captured = messages
      .map((m) =>
        m instanceof SystemMessage
          ? `SYSTEM: ${m.content}`
          : m instanceof HumanMessage
          ? `HUMAN: ${m.content}`
          : m instanceof AIMessage
          ? `AI: ${m.content}`
          : `MSG: ${(m as any).content}`
      )
      .join("\n\n");

    this.logger?.verbose(captured);
    return { messages, capturedPrompt: captured };
  }

  protected async processModelResponse(
    response: BaseMessage,
    sessionId: string,
    useHistory: boolean,
    capturedPrompt: string
  ) {
    if (useHistory && response instanceof AIMessage) {
      await this.messageHistoryStore(sessionId).addMessage(response);
    }
    const content = this.extractContent(response);
    const result = await this.parseContent(content, capturedPrompt);

    if (this.logger) {
      if (this.logger.getVerbosityLevel() === VerbosityLevel.VERBOSE) {
        this.logger.debug("LLM output with prompt:", {
          output: result.output,
          prompt: capturedPrompt,
        });
      } else {
        this.logger.debug("LLM output:", result.output);
      }
    }
    return result;
  }

  protected createAndExecuteSequence(
    generate: () => Promise<BaseMessage[]>,
    process: (r: BaseMessage) => Promise<GenerationResult<Out>>,
    config?: RunnableConfig
  ) {
    const seq = RunnableSequence.from([generate, this.model, process]);
    const logger = this.logger;
    return createRunnableRetry(seq, {
      stopAfterAttempt: this.maxAttempts,
      onFailedAttempt: (err, att) =>
        logger &&
        logger.warn(`Attempt ${att}/${this.maxAttempts} failed:`, err.message),
    }).invoke(null, config);
  }

  async invoke(
    input: In,
    config?: RunnableConfig
  ): Promise<GenerationResult<Out>> {
    if (!config?.configurable?.sessionId)
      throw new Error("configurable.sessionId is required");
    const sessionId = config.configurable.sessionId;
    const useHistory = config.configurable.useHistory !== false;

    let captured = "";
    const gen = async () => {
      const { messages, capturedPrompt } = await this.generatePromptMessages(
        input,
        sessionId,
        useHistory
      );
      captured = capturedPrompt;
      return messages;
    };
    const proc = (r: BaseMessage) =>
      this.processModelResponse(r, sessionId, useHistory, captured);

    return this.createAndExecuteSequence(gen, proc, config);
  }

  async batch(inputs: In[], configs?: RunnableConfig[] | RunnableConfig) {
    const cfgs = Array.isArray(configs)
      ? configs
      : inputs.map(() => configs as RunnableConfig);
    const out: GenerationResult<Out>[] = [];
    for (let i = 0; i < inputs.length; i++) {
      out.push(await this.invoke(inputs[i], cfgs[i]));
    }
    return out;
  }

  async clearHistory(sessionId: string) {
    await this.messageHistoryStore(sessionId).clear();
  }

  async clearAllHistories() {
    for (const h of this.inMemoryHistories.values()) {
      await h.clear();
    }
  }
}
