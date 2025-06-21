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
    opts: ObjectGenerationRunnableOptions<
      In,
      Out
    > = {} as ObjectGenerationRunnableOptions<In, Out>
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

    if (!content) {
      return "";
    }

    // First, remove any markdown code fences
    content = content.replace(/```json\s*/g, "").replace(/```\s*$/g, "");

    // Try to find the most complete JSON object in the content
    // First, try to find a complete JSON object that spans the entire content
    try {
      // Remove any text before the first { and after the last }
      const cleanedContent = content
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "");
      if (
        cleanedContent &&
        cleanedContent.startsWith("{") &&
        cleanedContent.endsWith("}")
      ) {
        // Try to parse it as JSON
        JSON.parse(cleanedContent);
        // Removed debug log for "Found complete JSON object in response"
        return cleanedContent;
      }
    } catch (e) {
      this.logger?.debug(`Failed to parse complete content as JSON: ${e}`);
    }

    // If that didn't work, try to find the largest valid JSON object in the content
    // Start by looking for balanced pairs of { and }
    let maxValidJson = "";
    let maxLength = 0;

    // Find all potential starting positions of JSON objects
    const startPositions = [];
    for (let i = 0; i < content.length; i++) {
      if (content[i] === "{") {
        startPositions.push(i);
      }
    }

    // For each starting position, try to find a valid JSON object
    for (const start of startPositions) {
      let openBraces = 0;
      let foundEnd = false;

      // Find the matching closing brace
      for (let i = start; i < content.length; i++) {
        if (content[i] === "{") {
          openBraces++;
        } else if (content[i] === "}") {
          openBraces--;
          if (openBraces === 0) {
            // We found a potential JSON object
            const potentialJson = content.substring(start, i + 1);
            try {
              // Check if it's valid JSON
              JSON.parse(potentialJson);
              // If it's valid and longer than our current max, update the max
              if (potentialJson.length > maxLength) {
                maxValidJson = potentialJson;
                maxLength = potentialJson.length;
                this.logger?.debug(
                  `Found valid JSON object of length ${maxLength}`
                );
              }
            } catch (e) {
              // Not valid JSON, continue
              this.logger?.debug(`Invalid JSON object: ${e}`);
            }
            foundEnd = true;
            break;
          }
        }
      }

      // If we didn't find a matching closing brace, move on to the next starting position
      if (!foundEnd) {
        continue;
      }
    }

    // If we found a valid JSON object, return it
    if (maxValidJson) {
      this.logger?.debug(
        `Returning largest valid JSON object of length ${maxLength}`
      );
      return maxValidJson;
    }

    // If we still couldn't find a valid JSON object, fall back to the original approach
    const jsonMatch = content.match(/^\s*(\{[\s\S]*\})\s*$/);
    if (jsonMatch) {
      return jsonMatch[1];
    }

    // If all else fails, return the content as is
    return content;
  }

  async invoke(
    input: In,
    config?: RunnableConfig & { exclude?: string[] }
  ): Promise<Out> {
    this.logger?.info("Starting object generation...");
    const startTime = Date.now();

    const exclusions: string[] = (config as any)?.exclude ?? [];
    if (!config?.configurable?.sessionId) {
      throw new Error("configurable.sessionId is required");
    }
    const sessionId = config.configurable.sessionId;
    const useHistory = config.configurable.useHistory !== false;

    this.logger?.debug(`Session ID: ${sessionId}, Use History: ${useHistory}`);

    const activeSchema =
      exclusions.length > 0
        ? pruneSchema(this.outputSchema, exclusions)
        : this.outputSchema;
    this.logger?.debug(
      `Using ${exclusions.length > 0 ? "pruned" : "original"} schema`
    );

    const parser = StructuredOutputParser.fromZodSchema(activeSchema);
    const fixingParser = OutputFixingParser.fromLLM(this.model, parser);

    let capturedPrompt = "";
    const gen = async () => {
      const validated = this.inputSchema.parse(input);
      // Removed debug log for "Input validated"

      const humanLines = [
        "Given the following input, generate an object that **strictly** matches the schema above.",
        "",
        "INPUT:",
        JSON.stringify(validated, null, 2),
        "",
        "CRITICAL INSTRUCTIONS:",
        "1. Return ONLY the raw JSON object that matches the schema.",
        "2. DO NOT return the schema definition itself.",
        "3. DO NOT use markdown formatting or code fences (```json).",
        "4. DO NOT include any explanations, notes, commentary or text before or after the JSON.",
        "5. NEVER add any notes, commentary or messages.",
        "6. The response should start with { and end with } - nothing else.",
        "7. Give me JUST raw JSON.",
      ];

      const systemContent = `${
        this.systemPrompt
      }\n\nIMPORTANT: You must return ONLY a valid JSON object matching the schema. DO NOT return the schema definition itself. DO NOT use markdown code fences. DO NOT include any explanations, notes, commentary or messages. Start your response with { and end with } - nothing else. Give me JUST raw JSON.\n\n${parser.getFormatInstructions()}`;
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
      this.logger?.debug("Processing LLM response...");

      if (useHistory && response instanceof AIMessage) {
        this.logger?.debug("Adding message to history store");
        await this.messageHistoryStore(sessionId).addMessage(response);
      }

      this.logger?.debug("Extracting content from response");
      const content = this.extractContent(response);

      if (!content) {
        this.logger?.warn("Extracted content is empty");
      } else {
        this.logger?.debug(
          `Extracted content length: ${content.length} characters`
        );
      }

      let result: Out;
      try {
        this.logger?.debug("Attempting to parse with structured output parser");
        result = (await parser.parse(content)) as Out;
        this.logger?.debug("Successfully parsed with structured output parser");
      } catch (error) {
        this.logger?.debug(
          `Structured parser failed: ${error}. Trying fixing parser...`
        );
        try {
          result = (await fixingParser.parse(content)) as Out;
          this.logger?.debug("Successfully parsed with fixing parser");
        } catch (fixError) {
          this.logger?.error(
            `Both parsers failed. Original error: ${error}, Fixing error: ${fixError}`
          );
          throw fixError; // Re-throw to trigger retry
        }
      }

      // Log the generated object
      this.logger?.info("Generated object:", JSON.stringify(result, null, 2));

      return result;
    };

    const seq = RunnableSequence.from([gen, this.model, proc]);
    const result = await createRunnableRetry(seq, {
      stopAfterAttempt: this.maxAttempts,
      onFailedAttempt: (err, att) =>
        this.logger?.warn(`Attempt ${att}/${this.maxAttempts} failed:`, err),
    }).invoke(null, config);

    // Log completion time
    const endTime = Date.now();
    const duration = endTime - startTime;
    this.logger?.info(`Object generation completed in ${duration}ms`);

    return result;
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
