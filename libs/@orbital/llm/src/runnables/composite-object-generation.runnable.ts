/* libs/@orbital/llm/src/runnables/composite-object-generation.runnable.ts */

import { zodSchemaRegistry } from "@orbital/core";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  ObjectGenerationRunnable,
  ObjectGenerationRunnableOptions,
} from "./object-generation.runnable";

/**
 * Utility to set a nested value at the given path on an object.
 */
function setAtPath(obj: any, path: string, value: any): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Composite runnable that generates an object and its nested parts.
 */
export class CompositeObjectGenerationRunnable<T extends object> {
  constructor(
    private readonly type: new (...args: any[]) => T,
    private readonly options: ObjectGenerationRunnableOptions<any, any>
  ) {}

  /**
   * Invoke generation for the root object and any nested inputs.
   * @param rootInput Input for the top-level object.
   * @param nestedInputs Map of nested input data keyed by JSON path.
   */
  /**
   * Invoke generation for the root object and any nested inputs.
   * @param rootInput Input for the top-level object.
   * @param nestedInputs Map of nested input data keyed by JSON path.
   * @param config Optional configuration including verbose mode.
   * @returns The generated object, with verbose data if requested.
   */
  async invoke(
    rootInput: any,
    nestedInputs: Record<string, any> = {},
    config?: RunnableConfig & { verbose?: boolean }
  ): Promise<T & { _verbose?: Record<string, any> }> {
    const sessionId = `composite-${Date.now()}`;
    const nestedPaths = Object.keys(nestedInputs);
    const isVerbose = Boolean(config?.verbose);
    const verboseData: Record<string, any> = {};

    // Construct root options with schema fallbacks
    const typeName = this.type.name;
    const registry = this.options.schemaRegistry ?? zodSchemaRegistry;
    const inSchemaExists = Boolean(
      this.options.inputSchema ||
        registry.get((globalThis as any)[`${typeName}GenerationInputSchema`])
    );
    const outSchemaExists = Boolean(
      this.options.outputSchema || registry.get(this.type as object)
    );
    const rootOptions: any = { ...this.options };
    if (!inSchemaExists) {
      rootOptions.inputSchema = require("zod").z.any();
    }
    if (!outSchemaExists) {
      rootOptions.outputSchema = require("zod").z.any();
    }
    // Generate the root object, excluding any nested fields
    const rootRunnable = new ObjectGenerationRunnable(this.type, rootOptions);

    // Prepare config for root invocation
    const rootConfig: RunnableConfig & { exclude?: string[] } = {
      ...(config || {}),
      configurable: {
        ...(config?.configurable || {}),
        sessionId,
      },
      exclude: nestedPaths,
    };

    // Add callbacks for verbose mode if enabled
    let rootVerboseData: any = null;
    if (isVerbose) {
      rootConfig.callbacks = [
        {
          handleLLMEnd: (output: any) => {
            rootVerboseData = output;
          },
        },
      ];
    }

    // Invoke root runnable
    const rootResult = await rootRunnable.invoke(rootInput, rootConfig);
    const root: any = rootResult;

    // Store verbose data for root if available
    if (isVerbose && rootVerboseData) {
      verboseData.root = rootVerboseData;
    }

    // For each nested path, only generate if an input schema is registered
    for (const path of nestedPaths) {
      const segments = path.split(".");
      // Capitalize the type name to match PascalCase convention
      const rawTypeName = segments[segments.length - 1];
      const typeName =
        rawTypeName.charAt(0).toUpperCase() + rawTypeName.slice(1);

      // Look up the schema class and actual Zod schema
      const schemaClass = (globalThis as any)[
        `${typeName}GenerationInputSchema`
      ];
      const inputSchema = zodSchemaRegistry.get(schemaClass);
      if (!inputSchema) {
        continue;
      }

      // Look up the nested type constructor
      const TypeConstructor = (globalThis as any)[typeName];
      if (!TypeConstructor) {
        continue;
      }

      // Instantiate and run nested generation with parent context prompt
      const nestedOptions = { ...this.options };
      // Ensure we have a system prompt for the nested runnable
      const nestedSystemPrompt =
        `The object you will generate is part of a larger ${this.type.name} object:\n` +
        JSON.stringify(root, null, 2);

      // If the original options had a system prompt, append to it
      if (this.options.systemPrompt) {
        nestedOptions.systemPrompt = `${this.options.systemPrompt}\n\n${nestedSystemPrompt}`;
      } else {
        nestedOptions.systemPrompt = nestedSystemPrompt;
      }

      // Explicitly set input schema
      nestedOptions.inputSchema = inputSchema;

      // Set output schema fallback if needed
      if (
        !zodSchemaRegistry.get(TypeConstructor) &&
        !nestedOptions.outputSchema
      ) {
        nestedOptions.outputSchema = require("zod").z.any();
      }

      const nestedRunnable = new ObjectGenerationRunnable(
        TypeConstructor,
        nestedOptions
      );
      // Prepare config for nested invocation
      const nestedConfig: RunnableConfig = {
        ...(config || {}),
        configurable: {
          ...(config?.configurable || {}),
          sessionId: `${sessionId}-${path}`,
        },
      };

      // Add callbacks for verbose mode if enabled
      let nestedVerboseData: any = null;
      if (isVerbose) {
        nestedConfig.callbacks = [
          {
            handleLLMEnd: (output: any) => {
              nestedVerboseData = output;
            },
          },
        ];
      }

      // Invoke the nested runnable
      const nestedResult = await nestedRunnable.invoke(
        nestedInputs[path],
        nestedConfig
      );

      // Store verbose data for this nested path if available
      if (isVerbose && nestedVerboseData) {
        verboseData[path] = nestedVerboseData;
      }

      // Merge nested result into the root object
      setAtPath(root, path, nestedResult);
    }

    // If verbose mode is enabled, attach the verbose data to the result
    if (isVerbose && Object.keys(verboseData).length > 0) {
      (root as any)._verbose = verboseData;
    }

    return root;
  }
}
