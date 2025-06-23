/* libs/@orbital/llm/src/runnables/composite-object-generation.runnable.ts */

import { zodSchemaRegistry } from "@orbital/core";
import { schemaRegistry } from "@orbital/core";
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
    private readonly options: ObjectGenerationRunnableOptions<
      any,
      any
    > = {} as ObjectGenerationRunnableOptions<any, any>
  ) {}

  /**
   * Invoke generation for the root object and any nested inputs.
   *
   * @param input A single object containing both root properties and nested objects.
   *              Any property that is an object or ObjectGenerationRunnable will be treated as a nested input.
   * @param config Optional configuration including verbose mode.
   * @returns The generated object, with verbose data if requested.
   *
   * @example
   * ```typescript
   * // Simple usage with just root properties
   * const result = await runnable.invoke({ climate: "winter" });
   *
   * // With nested objects
   * const result = await runnable.invoke({
   *   climate: "winter",
   *   areaMap: { size: 'small' }
   * });
   *
   * // With a mix of properties and ObjectGenerationRunnable instances
   * const result = await runnable.invoke({
   *   climate: "winter",
   *   areaMap: new ObjectGenerationRunnable(AreaMap, options)
   * });
   * ```
   */
  async invoke(
    input: any,
    config?: RunnableConfig & { verbose?: boolean }
  ): Promise<T & { _verbose?: Record<string, any> }> {
    // Separate root properties from nested objects
    const nestedInputs: Record<
      string,
      any | ObjectGenerationRunnable<any, any>
    > = {};
    const rootInput: Record<string, any> = {};

    // Process each property in the input
    for (const [key, value] of Object.entries(input)) {
      // Skip the 'verbose' key as it's a config flag, not a nested object
      if (key === "verbose") {
        this.options.logger?.debug(
          `Skipping 'verbose' key in input as it's a config flag`
        );
        continue;
      }

      // If the value is an object or an ObjectGenerationRunnable, treat it as a nested input
      if (
        value instanceof ObjectGenerationRunnable ||
        (typeof value === "object" && value !== null && !Array.isArray(value))
      ) {
        nestedInputs[key] = value;
      } else {
        // Otherwise, it's a root property
        rootInput[key] = value;
      }
    }

    this.options.logger?.debug(
      `Separated input into root and nested properties`
    );
    this.options.logger?.debug(
      `Root properties: ${Object.keys(rootInput).join(", ")}`
    );
    this.options.logger?.debug(
      `Nested properties: ${Object.keys(nestedInputs).join(", ")}`
    );

    this.options.logger?.info("Starting composite object generation...");
    const startTime = Date.now();

    const sessionId = `composite-${Date.now()}`;
    const nestedPaths = Object.keys(nestedInputs);
    const isVerbose = Boolean(config?.verbose);
    const verboseData: Record<string, any> = {};

    this.options.logger?.debug(`Session ID: ${sessionId}`);
    this.options.logger?.debug(`Nested paths: ${nestedPaths.join(", ")}`);
    this.options.logger?.debug(`Verbose mode: ${isVerbose}`);

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

    // Log the final composite object with all nested objects
    if (this.options.logger) {
      this.options.logger?.info(
        "Generated composite object:",
        JSON.stringify(root, null, 2)
      );
    }

    // Log completion time
    const endTime = Date.now();
    const duration = endTime - startTime;
    this.options.logger?.info(
      `Composite object generation completed in ${duration}ms`
    );

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

    // DEPRECATED: Using globalThis lookup
    if (!this.options.inputSchema && !registry.get(this.type as object)) {
      this.options.logger?.debug(
        `WARNING: Using deprecated globalThis lookup for schema ${inputSchemaKey}. ` +
          `Use @ZodSchema decorator to register your types in the schemaRegistry.`
      );
    }

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
    this.options.logger?.debug("Generating root object...");
    const startTime = Date.now();

    // Create root runnable
    const rootRunnable = this.createRootRunnable();
    this.options.logger?.debug(
      `Created root runnable for type: ${this.type.name}`
    );

    // Prepare config for root invocation
    const { config, verboseDataCapture } = this.prepareRunnableConfig(
      baseConfig,
      sessionId,
      isVerbose,
      { exclude: nestedPaths }
    );
    this.options.logger?.debug(
      `Prepared config with ${nestedPaths.length} excluded paths`
    );

    // Invoke root runnable
    this.options.logger?.debug("Invoking root runnable...");
    const root = await rootRunnable.invoke(rootInput, config);

    const endTime = Date.now();
    this.options.logger?.debug(
      `Root object generated in ${endTime - startTime}ms`
    );

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
    // Attempt to find nested schema & ctor in central registry first
    const segments = path.split(".");
    let rawTypeName = segments[segments.length - 1];
    // derive a name for central-registry lookup
    const registryTypeName = upperFirst(
      rawTypeName.replace(/\[.*?\]/, "").replace(/s$/, "")
    );
    const registryEntry = schemaRegistry.get(registryTypeName);
    if (registryEntry) {
      const { ctor: TypeConstructor, schema: inputSchema } = registryEntry;
      const nestedOptions = { ...this.options, inputSchema };
      // apply parent context and return
      const nestedSystemPrompt = this.createParentContextPrompt(root);
      const typeInstructions = `IMPORTANT: Ensure all properties match their expected types:
- String properties must be strings
- Number properties must be numbers (not strings containing numbers)
- Boolean properties must be true or false
- Array properties must be arrays`;
      nestedOptions.systemPrompt = this.options.systemPrompt
        ? `${this.options.systemPrompt}\n\n${typeInstructions}\n\n${nestedSystemPrompt}`
        : `${typeInstructions}\n\n${nestedSystemPrompt}`;
      return new ObjectGenerationRunnable(TypeConstructor, nestedOptions);
    }

    // Fallback: Extract and capitalize type name from path using lodash.upperFirst
    // Handle arrays and plurals below
    rawTypeName = segments[segments.length - 1];

    this.options.logger?.debug(
      `Creating nested runnable for path: ${path}, raw type name: ${rawTypeName}`
    );

    // Handle special path names that don't match their type names
    const pathToTypeMapping: Record<string, string> = {
      capital: "CityGenerator",
      areaMap: "AreaMap", // Add mapping for areaMap
      // Add more mappings as needed
    };

    // Check if we have a special mapping for this path
    if (pathToTypeMapping[rawTypeName]) {
      rawTypeName = pathToTypeMapping[rawTypeName];
      this.options.logger?.debug(`Using mapped type name: ${rawTypeName}`);

      // Check schemaRegistry again with the mapped type name
      const mappedTypeName = rawTypeName;
      const mappedRegistryEntry = schemaRegistry.get(mappedTypeName);
      if (mappedRegistryEntry) {
        this.options.logger?.debug(
          `Found mapped type ${mappedTypeName} in schemaRegistry`
        );
        const { ctor: TypeConstructor, schema: inputSchema } =
          mappedRegistryEntry;
        const nestedOptions = { ...this.options, inputSchema };
        // apply parent context and return
        const nestedSystemPrompt = this.createParentContextPrompt(root);
        const typeInstructions = `IMPORTANT: Ensure all properties match their expected types:
- String properties must be strings
- Number properties must be numbers (not strings containing numbers)
- Boolean properties must be true or false
- Array properties must be arrays`;
        nestedOptions.systemPrompt = this.options.systemPrompt
          ? `${this.options.systemPrompt}\n\n${typeInstructions}\n\n${nestedSystemPrompt}`
          : `${typeInstructions}\n\n${nestedSystemPrompt}`;
        return new ObjectGenerationRunnable(TypeConstructor, nestedOptions);
      }
    } else if (rawTypeName.includes("[")) {
      // Handle array paths like "cities[0]" by extracting the base name
      rawTypeName = rawTypeName.split("[")[0];
      // Remove trailing 's' for common plural->singular conversion (e.g., cities -> city)
      if (rawTypeName.endsWith("s")) {
        rawTypeName = rawTypeName.slice(0, -1);
      }
      this.options.logger?.debug(
        `Processed array path to type name: ${rawTypeName}`
      );

      // For array items, check if we can find the singular form in the registry
      const singularTypeName = upperFirst(rawTypeName);
      this.options.logger?.debug(
        `Checking registry for singular type: ${singularTypeName}`
      );

      // Try both with and without Generator suffix
      const singularRegistryEntry =
        schemaRegistry.get(singularTypeName) ||
        schemaRegistry.get(`${singularTypeName}Generator`);

      if (singularRegistryEntry) {
        this.options.logger?.debug(`Found singular type in schemaRegistry`);
        const { ctor: TypeConstructor, schema: inputSchema } =
          singularRegistryEntry;
        const nestedOptions = { ...this.options, inputSchema };
        // apply parent context and return
        const nestedSystemPrompt = this.createParentContextPrompt(root);
        const typeInstructions = `IMPORTANT: Ensure all properties match their expected types:
- String properties must be strings
- Number properties must be numbers (not strings containing numbers)
- Boolean properties must be true or false
- Array properties must be arrays`;
        nestedOptions.systemPrompt = this.options.systemPrompt
          ? `${this.options.systemPrompt}\n\n${typeInstructions}\n\n${nestedSystemPrompt}`
          : `${typeInstructions}\n\n${nestedSystemPrompt}`;
        return new ObjectGenerationRunnable(TypeConstructor, nestedOptions);
      }
    }

    const typeName = upperFirst(rawTypeName);
    this.options.logger?.debug(`Final type name: ${typeName}`);

    // Look up the schema class and actual Zod schema using lodash.get
    // Try different schema key patterns
    let schemaClass;
    let inputSchema;

    // DEPRECATED: Fallback to globalThis lookup
    // This fallback will be removed in a future version
    // Please use @ZodSchema decorator to register your types in the schemaRegistry
    this.options.logger?.debug(
      `WARNING: Falling back to deprecated globalThis lookup for ${typeName}. ` +
        `Use @ZodSchema decorator to register your types in the schemaRegistry.`
    );

    // First try the standard pattern: TypeNameGenerationInputSchema
    const schemaKey1 = `${typeName}GenerationInputSchema`;
    this.options.logger?.debug(
      `Looking for schema class with key: ${schemaKey1}`
    );
    schemaClass = get(globalThis, schemaKey1);

    if (schemaClass) {
      this.options.logger?.debug(`Found schema class: yes`);
      inputSchema = zodSchemaRegistry.get(schemaClass);
    } else {
      this.options.logger?.debug(`Found schema class: no`);

      // Try alternative pattern: TypeInputSchema (used in E2E tests)
      const schemaKey2 = `${typeName.replace("Generator", "")}InputSchema`;
      this.options.logger?.debug(
        `Looking for alternative schema key: ${schemaKey2}`
      );
      schemaClass = get(globalThis, schemaKey2);

      if (schemaClass) {
        this.options.logger?.debug(`Found alternative schema class: yes`);
        inputSchema = zodSchemaRegistry.get(schemaClass);
      } else {
        this.options.logger?.debug(`Found alternative schema class: no`);
      }
    }

    this.options.logger?.debug(
      `Found input schema: ${inputSchema ? "yes" : "no"}`
    );

    if (!inputSchema) {
      this.options.logger?.debug(`Failed to find input schema for ${typeName}`);
      return null;
    }

    // Look up the nested type constructor using lodash.get
    this.options.logger?.debug(`Looking for type constructor: ${typeName}`);
    this.options.logger?.debug(
      `WARNING: Using deprecated globalThis lookup for constructor ${typeName}. ` +
        `Use @ZodSchema decorator to register your types in the schemaRegistry.`
    );
    const TypeConstructor = get(globalThis, typeName);
    this.options.logger?.debug(
      `Found type constructor: ${TypeConstructor ? "yes" : "no"}`
    );

    if (!TypeConstructor) {
      this.options.logger?.debug(
        `Failed to find type constructor for ${typeName}`
      );
      return null;
    }

    // Create options for the nested runnable
    const nestedOptions = { ...this.options };

    // Add parent context to system prompt
    const nestedSystemPrompt = this.createParentContextPrompt(root);

    // Add explicit type instructions
    const typeInstructions = `IMPORTANT: Ensure all properties match their expected types:
- String properties must be strings
- Number properties must be numbers (not strings containing numbers)
- Boolean properties must be true or false
- Array properties must be arrays`;

    if (this.options.systemPrompt) {
      nestedOptions.systemPrompt = `${this.options.systemPrompt}\n\n${typeInstructions}\n\n${nestedSystemPrompt}`;
    } else {
      nestedOptions.systemPrompt = `${typeInstructions}\n\n${nestedSystemPrompt}`;
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
    this.options.logger?.debug(`Processing nested input for path: ${path}`);
    const startTime = Date.now();

    // Prepare config for nested invocation
    const { config, verboseDataCapture } = this.prepareRunnableConfig(
      cloneDeep(baseConfig), // Use cloneDeep to avoid modifying the original config
      sessionId,
      isVerbose,
      { pathSuffix: path }
    );
    this.options.logger?.debug(`Prepared config for path: ${path}`);

    let nestedResult: any;

    // Check if the nested value is a runnable
    if (nestedValue instanceof ObjectGenerationRunnable) {
      this.options.logger?.debug(`Using provided runnable for path: ${path}`);
      // If a runnable is provided, use it directly
      const runnable = nestedValue as ObjectGenerationRunnable<any, any>;

      // Add parent context to the runnable's system prompt
      const parentContextPrompt = this.createParentContextPrompt(root);
      runnable.updateSystemPrompt(parentContextPrompt);
      this.options.logger?.debug(
        `Updated system prompt with parent context for path: ${path}`
      );

      // Invoke the provided runnable with empty input
      this.options.logger?.debug(
        `Invoking provided runnable for path: ${path}`
      );
      nestedResult = await runnable.invoke({}, config);
      this.options.logger?.debug(
        `Completed invocation of provided runnable for path: ${path}`
      );
    } else {
      // Otherwise, create a new runnable based on the path
      this.options.logger?.debug(`Creating new runnable for path: ${path}`);
      const nestedRunnable = this.createNestedRunnable(path, root);
      if (!nestedRunnable) {
        this.options.logger?.warn(
          `Failed to create runnable for path: ${path}`
        );
        return null;
      }
      this.options.logger?.debug(
        `Successfully created runnable for path: ${path}`
      );

      // Invoke the nested runnable with the provided input
      this.options.logger?.debug(`Invoking new runnable for path: ${path}`);
      nestedResult = await nestedRunnable.invoke(nestedValue, config);
      this.options.logger?.debug(
        `Completed invocation of new runnable for path: ${path}`
      );
    }

    const endTime = Date.now();
    this.options.logger?.debug(
      `Processed nested input for path: ${path} in ${endTime - startTime}ms`
    );

    // Special handling for certain paths
    if (path === "capital") {
      // For capital path, the nestedResult is the capital object itself
      this.options.logger?.debug(
        `Using direct result for capital path: ${path}`
      );
      return {
        result: nestedResult,
        verboseData: verboseDataCapture.data,
      };
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
    this.options.logger?.debug(
      `Generating ${nestedPaths.length} nested objects...`
    );
    const startTime = Date.now();

    // Process each nested path
    for (let i = 0; i < nestedPaths.length; i++) {
      const path = nestedPaths[i];
      const nestedValue = nestedInputs[path];

      this.options.logger?.debug(
        `Processing nested path ${i + 1}/${nestedPaths.length}: ${path}`
      );
      const pathStartTime = Date.now();

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
        this.options.logger?.warn(
          `Skipping path ${path} due to processing failure`
        );
        continue;
      }

      // Store verbose data if available
      if (isVerbose && result.verboseData) {
        verboseData[path] = result.verboseData;
        this.options.logger?.debug(`Stored verbose data for path: ${path}`);
      }

      // Merge nested result into the root object using lodash.set
      this.options.logger?.debug(
        `Before merge, root object has ${Object.keys(root).length} properties`
      );
      this.options.logger?.debug(`Merging result for path: ${path}`);
      set(root, path, result.result);
      this.options.logger?.debug(`Merged result for path: ${path}`);

      const pathEndTime = Date.now();
      this.options.logger?.debug(
        `Completed path ${path} in ${pathEndTime - pathStartTime}ms`
      );
    }

    const endTime = Date.now();
    this.options.logger?.debug(
      `All nested objects generated in ${endTime - startTime}ms`
    );
  }
}
