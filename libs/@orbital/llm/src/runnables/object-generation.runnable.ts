/* libs/@orbital/llm/src/runnables/object-generation.runnable.ts */

import type { ZodSchema } from "zod";
import { z, ZodObject, ZodRawShape, ZodTypeAny } from "zod";
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
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { IObjectGenerationPromptRepository } from "./object-generation-prompt-repository.interface";

// Schema pruning utilities for exclude option
function deepOmitShape(shape: ZodRawShape, exclusions: string[]): ZodRawShape {
  const newShape: ZodRawShape = {};
  for (const key of Object.keys(shape)) {
    const childExclusions = exclusions
      .filter((p) => p.startsWith(`${key}.`))
      .map((p) => p.slice(key.length + 1));
    if (exclusions.includes(key)) continue;
    const fieldSchema = (shape as any)[key];
    if (childExclusions.length > 0 && fieldSchema instanceof ZodObject) {
      const nested = deepOmitShape(
        (fieldSchema as any)._def.shape(),
        childExclusions
      );
      newShape[key] = z.object(nested) as ZodTypeAny;
    } else {
      newShape[key] = fieldSchema as ZodTypeAny;
    }
  }
  return newShape;
}

function pruneSchema(
  schema: ZodSchema<any>,
  exclusions: string[]
): ZodSchema<any> {
  if (!(schema instanceof ZodObject)) return schema;
  const raw = (schema as any)._def.shape();
  const pruned = deepOmitShape(raw, exclusions);
  return z.object(pruned) as ZodObject<any>;
}

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
}

export class ObjectGenerationRunnable<In, Out> extends Runnable<In, Out> {
  private readonly inputSchema: ZodSchema<In>;
  private readonly outputSchema: ZodSchema<Out>;
  private readonly model: BaseLanguageModel;
  private systemPrompt: string; // Changed from readonly to allow updates
  private readonly maxAttempts: number;
  private readonly messageHistoryStore: (id: string) => BaseChatMessageHistory;
  private readonly inMemoryHistories = new Map<
    string,
    InMemoryChatMessageHistory
  >();
  protected readonly logger?: Logger;

  lc_namespace = ["orbital", "object-generation"];

  constructor(
    /** Decorated type for inference */
    private readonly type: new (...args: any[]) => any,
    opts: ObjectGenerationRunnableOptions<In, Out>
  ) {
    super();
    const registry = opts.schemaRegistry ?? zodSchemaRegistry;
    const typeName = this.type.name ?? "";

    const inSch =
      opts.inputSchema ??
      registry.get((globalThis as any)[`${typeName}GenerationInputSchema`]);
    if (!inSch) {
      throw new Error(`Input schema not found for type ${typeName}`);
    }

    const outSch = opts.outputSchema ?? registry.get(this.type as object);
    if (!outSch) {
      throw new Error(`Output schema not found for type ${typeName}`);
    }

    let sysPrompt = opts.systemPrompt;
    const promptRepo = opts.promptRepository;
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

    const store =
      opts.messageHistoryStore ??
      ((sid: string) => {
        if (!this.inMemoryHistories.has(sid)) {
          this.inMemoryHistories.set(sid, new InMemoryChatMessageHistory());
        }
        return this.inMemoryHistories.get(sid)!;
      });

    this.inputSchema = inSch as ZodSchema<In>;
    this.outputSchema = outSch as ZodSchema<Out>;
    this.model = opts.model;
    this.systemPrompt = sysPrompt;
    this.maxAttempts = opts.maxAttempts ?? 3;
    this.logger = opts.logger;
    this.messageHistoryStore = store;
  }

  /**
   * Updates the system prompt, appending the provided text.
   * @param additionalPrompt Text to append to the existing system prompt
   */
  updateSystemPrompt(additionalPrompt: string): void {
    this.systemPrompt = `${this.systemPrompt}\n\n${additionalPrompt}`;
  }

  protected extractContent(response: BaseMessage): string {
    let content = "";
    if (response instanceof AIMessage) {
      content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
    } else if (typeof response === "string") {
      content = response;
    } else if (response && typeof (response as any).content === "string") {
      content = (response as any).content;
    } else if (response) {
      try {
        const str = JSON.stringify(response);
        const parsed = JSON.parse(str);
        content = parsed.invoke?.kwargs?.content ?? parsed.content ?? str;
      } catch {
        content = String(response);
      }
    }
    if (content) {
      content = content.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
      const jsonMatch = content.match(/^\s*(\{[\s\S]*\})\s*$/);
      if (jsonMatch) {
        return jsonMatch[1];
      }
    }
    return content || "";
  }

  async invoke(
    input: In,
    config?: RunnableConfig & { exclude?: string[] }
  ): Promise<Out> {
    const exclusions: string[] = (config as any)?.exclude ?? [];
    if (!config?.configurable?.sessionId) {
      throw new Error("configurable.sessionId is required");
    }
    const sessionId = config.configurable.sessionId;
    const useHistory = config.configurable.useHistory !== false;

    const activeSchema =
      exclusions.length > 0
        ? pruneSchema(this.outputSchema, exclusions)
        : this.outputSchema;
    const parser = StructuredOutputParser.fromZodSchema(activeSchema);
    const fixingParser = OutputFixingParser.fromLLM(this.model, parser);

    let capturedPrompt = "";
    const gen = async () => {
      const validated = this.inputSchema.parse(input);
      this.logger?.debug("Input validated:", validated);

      const humanLines = [
        "Given the following input, generate an object that **strictly** matches the schema above.",
        "",
        "INPUT:",
        JSON.stringify(validated, null, 2),
        "",
        "IMPORTANT: Return **ONLY** raw JSON without any markdown formatting or code fences.",
      ];

      const systemContent = `${
        this.systemPrompt
      }\n\n${parser.getFormatInstructions()}`;
      const messages: BaseMessage[] = [
        new SystemMessage(systemContent),
        ...(useHistory
          ? await this.messageHistoryStore(sessionId).getMessages()
          : []),
        new HumanMessage(humanLines.join("\n")),
      ];

      capturedPrompt = messages
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
      this.logger?.verbose(capturedPrompt);
      return messages;
    };

    const proc = async (response: BaseMessage): Promise<Out> => {
      if (useHistory && response instanceof AIMessage) {
        await this.messageHistoryStore(sessionId).addMessage(response);
      }
      const content = this.extractContent(response);
      try {
        return (await parser.parse(content)) as Out;
      } catch {
        return (await fixingParser.parse(content)) as Out;
      }
    };

    const seq = RunnableSequence.from([gen, this.model, proc]);
    return createRunnableRetry(seq, {
      stopAfterAttempt: this.maxAttempts,
      onFailedAttempt: (err, att) =>
        this.logger?.warn(`Attempt ${att}/${this.maxAttempts} failed:`, err),
    }).invoke(null, config);
  }

  async batch(inputs: In[], configs?: RunnableConfig[] | RunnableConfig) {
    const cfgs = Array.isArray(configs)
      ? configs
      : inputs.map(() => configs as RunnableConfig);
    const out: Out[] = [];
    for (let i = 0; i < inputs.length; i++) {
      out.push(await this.invoke(inputs[i], cfgs[i] as any));
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

// Export pruning utils for testing
export { deepOmitShape, pruneSchema };
