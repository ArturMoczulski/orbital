/* libs/@orbital/llm/src/runnables/composite-object-generation.runnable.ts */

import { zodSchemaRegistry } from "@orbital/core";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  ObjectGenerationRunnable,
  ObjectGenerationRunnableOptions,
} from "./object-generation.runnable";
import { set, merge, upperFirst, cloneDeep, get, isEmpty, pick } from "lodash";

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
   * @param nestedInputs Map of nested inputs keyed by JSON path. Each value can be either:
   *                     - An input object for a new ObjectGenerationRunnable
   *                     - An ObjectGenerationRunnable instance to use directly
   * @param config Optional configuration including verbose mode.
   * @returns The generated object, with verbose data if requested.
   */
  async invoke(
    rootInput: any,
    nestedInputs: Record<string, any | ObjectGenerationRunnable<any, any>> = {},
    config?: RunnableConfig & { verbose?: boolean }
  ): Promise<T & { _verbose?: Record<string, any> }> {
    const sessionId = `composite-${Date.now()}`;
    const nestedPaths = Object.keys(nestedInputs);
    const isVerbose = Boolean(config?.verbose);
    const verboseData: Record<string, any> = {};

    // Step 1: Generate the root object
    const { root, rootVerboseData } = await this.generateRootObject(
      rootInput,
      nestedPaths,
      sessionId,
      config,
      isVerbose
    );

    // Store verbose data for root if available
    if (isVerbose && rootVerboseData) {
      verboseData.root = rootVerboseData;
    }

    // Step 2: Generate all nested objects
    await this.generateNestedObjects(
      root,
      nestedInputs,
      nestedPaths,
      sessionId,
      config,
      isVerbose,
      verboseData
    );

    // Step 3: Add verbose data to result if needed
    if (isVerbose && !isEmpty(verboseData)) {
      (root as any)._verbose = verboseData;
    }

    return root;
  }

  /**
   * Creates a root runnable with appropriate schema fallbacks.
   */
  protected createRootRunnable(): ObjectGenerationRunnable<any, any> {
    const typeName = this.type.name;
    const registry = this.options.schemaRegistry ?? zodSchemaRegistry;

    // Check if schemas exist using lodash.get for safer property access
    const inputSchemaKey = `${typeName}GenerationInputSchema`;
    const inSchemaExists = Boolean(
      this.options.inputSchema || registry.get(get(globalThis, inputSchemaKey))
    );
    const outSchemaExists = Boolean(
      this.options.outputSchema || registry.get(this.type as object)
    );

    // Create options with fallbacks
    const rootOptions: any = { ...this.options };
    if (!inSchemaExists) {
      rootOptions.inputSchema = require("zod").z.any();
    }
    if (!outSchemaExists) {
      rootOptions.outputSchema = require("zod").z.any();
    }

    return new ObjectGenerationRunnable(this.type, rootOptions);
  }

  /**
   * Prepares a config for a runnable invocation, including verbose callbacks.
   */
  protected prepareRunnableConfig(
    baseConfig: RunnableConfig | undefined,
    sessionId: string,
    isVerbose: boolean,
    options: {
      exclude?: string[];
      pathSuffix?: string;
    } = {}
  ): { config: RunnableConfig; verboseDataCapture: { data: any } } {
    // Create config with session ID using lodash.merge
    const config: RunnableConfig = merge({}, baseConfig || {}, {
      configurable: {
        sessionId: options.pathSuffix
          ? `${sessionId}-${options.pathSuffix}`
          : sessionId,
      },
    });

    // Add exclude if provided using lodash.merge
    if (options.exclude) {
      merge(config, { exclude: options.exclude });
    }

    // Add callbacks for verbose mode
    const verboseDataCapture = { data: null };
    if (isVerbose) {
      config.callbacks = [
        {
          handleLLMEnd: (output: any) => {
            verboseDataCapture.data = output;
          },
        },
      ];
    }

    return { config, verboseDataCapture };
  }

  /**
   * Generates the root object using the root runnable.
   */
  protected async generateRootObject(
    rootInput: any,
    nestedPaths: string[],
    sessionId: string,
    baseConfig?: RunnableConfig & { verbose?: boolean },
    isVerbose = false
  ): Promise<{ root: any; rootVerboseData: any }> {
    // Create root runnable
    const rootRunnable = this.createRootRunnable();

    // Prepare config for root invocation
    const { config, verboseDataCapture } = this.prepareRunnableConfig(
      baseConfig,
      sessionId,
      isVerbose,
      { exclude: nestedPaths }
    );

    // Invoke root runnable
    const root = await rootRunnable.invoke(rootInput, config);

    return { root, rootVerboseData: verboseDataCapture.data };
  }

  /**
   * Creates a parent context prompt to pass to nested generations.
   */
  protected createParentContextPrompt(root: any): string {
    return (
      `The object you will generate is part of a larger ${this.type.name} object:\n` +
      JSON.stringify(root, null, 2)
    );
  }

  /**
   * Creates a nested runnable based on a path.
   */
  protected createNestedRunnable(
    path: string,
    root: any
  ): ObjectGenerationRunnable<any, any> | null {
    // Extract and capitalize type name from path using lodash.upperFirst
    const segments = path.split(".");
    const rawTypeName = segments[segments.length - 1];
    const typeName = upperFirst(rawTypeName);

    // Look up the schema class and actual Zod schema using lodash.get
    const schemaKey = `${typeName}GenerationInputSchema`;
    const schemaClass = get(globalThis, schemaKey);
    const inputSchema = zodSchemaRegistry.get(schemaClass);
    if (!inputSchema) {
      return null;
    }

    // Look up the nested type constructor using lodash.get
    const TypeConstructor = get(globalThis, typeName);
    if (!TypeConstructor) {
      return null;
    }

    // Create options for the nested runnable
    const nestedOptions = { ...this.options };

    // Add parent context to system prompt
    const nestedSystemPrompt = this.createParentContextPrompt(root);
    if (this.options.systemPrompt) {
      nestedOptions.systemPrompt = `${this.options.systemPrompt}\n\n${nestedSystemPrompt}`;
    } else {
      nestedOptions.systemPrompt = nestedSystemPrompt;
    }

    // Set schemas
    nestedOptions.inputSchema = inputSchema;
    if (
      !zodSchemaRegistry.get(TypeConstructor) &&
      !nestedOptions.outputSchema
    ) {
      nestedOptions.outputSchema = require("zod").z.any();
    }

    return new ObjectGenerationRunnable(TypeConstructor, nestedOptions);
  }

  /**
   * Processes a single nested input (either a runnable or static data).
   */
  protected async processNestedInput(
    path: string,
    nestedValue: any | ObjectGenerationRunnable<any, any>,
    root: any,
    sessionId: string,
    baseConfig?: RunnableConfig,
    isVerbose = false
  ): Promise<{ result: any; verboseData: any } | null> {
    // Prepare config for nested invocation
    const { config, verboseDataCapture } = this.prepareRunnableConfig(
      cloneDeep(baseConfig), // Use cloneDeep to avoid modifying the original config
      sessionId,
      isVerbose,
      { pathSuffix: path }
    );

    let nestedResult: any;

    // Check if the nested value is a runnable
    if (nestedValue instanceof ObjectGenerationRunnable) {
      // If a runnable is provided, use it directly
      const runnable = nestedValue as ObjectGenerationRunnable<any, any>;

      // Add parent context to the runnable's system prompt
      const parentContextPrompt = this.createParentContextPrompt(root);
      runnable.updateSystemPrompt(parentContextPrompt);

      // Invoke the provided runnable with empty input
      nestedResult = await runnable.invoke({}, config);
    } else {
      // Otherwise, create a new runnable based on the path
      const nestedRunnable = this.createNestedRunnable(path, root);
      if (!nestedRunnable) {
        return null;
      }

      // Invoke the nested runnable with the provided input
      nestedResult = await nestedRunnable.invoke(nestedValue, config);
    }

    return {
      result: nestedResult,
      verboseData: verboseDataCapture.data,
    };
  }

  /**
   * Generates all nested objects and merges them into the root.
   */
  protected async generateNestedObjects(
    root: any,
    nestedInputs: Record<string, any | ObjectGenerationRunnable<any, any>>,
    nestedPaths: string[],
    sessionId: string,
    baseConfig?: RunnableConfig,
    isVerbose = false,
    verboseData: Record<string, any> = {}
  ): Promise<void> {
    // Process each nested path
    for (const path of nestedPaths) {
      const nestedValue = nestedInputs[path];

      // Process the nested input
      const result = await this.processNestedInput(
        path,
        nestedValue,
        root,
        sessionId,
        baseConfig,
        isVerbose
      );

      // Skip if processing failed
      if (!result) {
        continue;
      }

      // Store verbose data if available
      if (isVerbose && result.verboseData) {
        verboseData[path] = result.verboseData;
      }

      // Merge nested result into the root object using lodash.set
      set(root, path, result.result);
    }
  }
}
