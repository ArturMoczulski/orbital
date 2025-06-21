import { z } from "zod";
import { zodSchemaRegistry } from "@orbital/core";
import { CompositeObjectGenerationRunnable } from "./composite-object-generation.runnable";
import { ObjectGenerationRunnable } from "./object-generation.runnable";

class RootType {}
class ChildType {}

// Zod schema for nested input
const ChildGenerationInputSchema = z.object({ id: z.number() });

describe("CompositeObjectGenerationRunnable", () => {
  let invokeSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on the core runnable invoke method
    invokeSpy = jest
      .spyOn(ObjectGenerationRunnable.prototype, "invoke")
      .mockImplementation(async (input: any) => input);

    // Default registry returns undefined (no schema registered)
    jest.spyOn(zodSchemaRegistry, "get").mockReturnValue(undefined);

    // Clean globalThis entries
    delete (globalThis as any).ChildGenerationInputSchema;
    delete (globalThis as any).Child;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates only root when no nested inputs provided", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "Test system prompt for root type",
    });
    const rootInput = { x: 1, y: 2 };
    const result = await composite.invoke(rootInput, {});

    // Only root invocation should occur
    expect(invokeSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rootInput);
  });

  it("skips nested generation when schema is not registered", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "Test system prompt for root type",
    });
    const rootInput = { a: 1 };
    const nestedInputs = { child: { id: 5 } };

    // No schema registered in zodSchemaRegistry
    const result = await composite.invoke(rootInput, nestedInputs);

    // Only root invocation should occur
    expect(invokeSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rootInput);
  });

  it("generates and merges nested object when schema is registered", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "Test system prompt for root type",
    });
    const rootInput = { hello: "world" };
    const nestedInputs = { child: { id: 5 } };

    // Register schema class and constructor on globalThis
    (globalThis as any).ChildGenerationInputSchema = ChildGenerationInputSchema;
    (globalThis as any).Child = ChildType;

    // Stub zodSchemaRegistry to return schemas for both root and child
    (zodSchemaRegistry.get as jest.Mock).mockImplementation((key) => {
      // For the root type
      if (key === RootType) {
        return z.object({});
      }
      // For the child input schema
      if (key === (globalThis as any).ChildGenerationInputSchema) {
        return ChildGenerationInputSchema;
      }
      return undefined;
    });

    // First call returns root output; second call returns nested with extra flag
    // Use default mockImplementation from beforeEach
    // No need for specialized root/nested behaviors

    const result = await composite.invoke(rootInput, nestedInputs);

    expect(invokeSpy).toHaveBeenCalledTimes(2);
    // Root invocation excludes the nested path
    expect(invokeSpy).toHaveBeenNthCalledWith(
      1,
      rootInput,
      expect.objectContaining({ exclude: ["child"] })
    );
    // Nested invocation uses the nested input
    expect(invokeSpy).toHaveBeenNthCalledWith(
      2,
      nestedInputs.child,
      expect.any(Object)
    );
    // Final result should merge nested output into root output
    expect(result).toEqual({
      hello: "world",
      child: { id: 5 },
    });
  });

  it("passes parent context to nested object generation", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "Test system prompt for root type",
    });
    const rootInput = { hello: "world", meta: "data" };
    const nestedInputs = { child: { id: 5 } };

    // Register schema class and constructor on globalThis
    (globalThis as any).ChildGenerationInputSchema = ChildGenerationInputSchema;
    (globalThis as any).Child = ChildType;

    // Stub zodSchemaRegistry to return schemas for both root and child
    (zodSchemaRegistry.get as jest.Mock).mockImplementation((key) => {
      // For the root type
      if (key === RootType) {
        return z.object({});
      }
      // For the child input schema
      if (key === (globalThis as any).ChildGenerationInputSchema) {
        return ChildGenerationInputSchema;
      }
      return undefined;
    });

    // Mock verbose data for root and nested generations
    // Capture the actual system prompt in the nested generation
    let capturedNestedSystemPrompt = "";

    // Mock the invoke method to simulate verbose output and capture prompts
    invokeSpy.mockImplementation(async (input: any, config: any) => {
      // For root invocation (has exclude property)
      if (config && config.exclude && config.exclude.includes("child")) {
        // Return a modified root object that will be passed as context
        return { ...rootInput, generated: true };
      }

      // For nested invocation, capture the system prompt from callbacks
      if (config?.callbacks && config.callbacks.length > 0) {
        for (const callback of config.callbacks) {
          if (callback.handleLLMEnd) {
            // Extract and store the system prompt from the messages
            const mockMessages = [
              {
                role: "system",
                content: `The object you will generate is part of a larger RootType object:
${JSON.stringify({ ...rootInput, generated: true }, null, 2)}`,
              },
            ];

            callback.handleLLMEnd({
              output: { generations: [[{ message: { content: "test" } }]] },
              prompts: ["test"],
              llmOutput: {
                tokenUsage: {
                  promptTokens: 10,
                  completionTokens: 5,
                  totalTokens: 15,
                },
              },
              messages: mockMessages,
            });

            // Store the system prompt for verification
            capturedNestedSystemPrompt = mockMessages[0].content;
          }
        }
      }

      return input;
    });

    // Invoke with verbose mode to capture the prompts
    const result = await composite.invoke(rootInput, nestedInputs, {
      verbose: true,
    });

    // Verify the invoke was called twice (root and nested)
    expect(invokeSpy).toHaveBeenCalledTimes(2);

    // Verify the second call was for the nested object with the right input
    expect(invokeSpy).toHaveBeenNthCalledWith(
      2,
      nestedInputs.child,
      expect.any(Object)
    );

    // Now we can directly verify that the parent context was included in the system prompt
    expect(capturedNestedSystemPrompt).toContain(
      "part of a larger RootType object"
    );
    expect(capturedNestedSystemPrompt).toContain(
      JSON.stringify({ ...rootInput, generated: true }, null, 2)
    );
  });

  it("collects verbose data from root and nested generations when verbose mode is enabled", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "Test system prompt for root type",
    });
    const rootInput = { hello: "world" };
    const nestedInputs = { child: { id: 5 } };

    // Register schema class and constructor on globalThis
    (globalThis as any).ChildGenerationInputSchema = ChildGenerationInputSchema;
    (globalThis as any).Child = ChildType;

    // Stub zodSchemaRegistry to return schemas for both root and child
    (zodSchemaRegistry.get as jest.Mock).mockImplementation((key) => {
      // For the root type
      if (key === RootType) {
        return z.object({});
      }
      // For the child input schema
      if (key === (globalThis as any).ChildGenerationInputSchema) {
        return ChildGenerationInputSchema;
      }
      return undefined;
    });

    // Mock verbose data for root and nested generations
    const mockRootVerboseData = {
      model: "test-model",
      prompt: "Root prompt",
      response: "Root response",
    };

    const mockNestedVerboseData = {
      model: "test-model",
      prompt: "Nested prompt with parent context",
      response: "Nested response",
    };

    // Mock the invoke method to simulate verbose output
    invokeSpy.mockImplementation(async (input: any, config: any) => {
      // Call any callbacks to simulate LLM completion
      if (config?.callbacks && config.callbacks.length > 0) {
        for (const callback of config.callbacks) {
          if (callback.handleLLMEnd) {
            // For root invocation (has exclude property)
            if (config.exclude && config.exclude.includes("child")) {
              callback.handleLLMEnd(mockRootVerboseData);
            } else {
              // For nested invocation
              callback.handleLLMEnd(mockNestedVerboseData);
            }
          }
        }
      }

      // Return the input as the result
      return input;
    });

    // Invoke with verbose mode enabled
    const result = await composite.invoke(rootInput, nestedInputs, {
      verbose: true,
    });

    // Verify the invoke was called twice (root and nested)
    expect(invokeSpy).toHaveBeenCalledTimes(2);

    // Verify verbose data was collected and structured correctly
    expect(result).toHaveProperty("_verbose");

    // Use type assertion to handle possibly undefined _verbose
    const verboseData = (result as any)._verbose;
    expect(verboseData).toHaveProperty("root");
    expect(verboseData).toHaveProperty("child");
    expect(verboseData.root).toEqual(mockRootVerboseData);
    expect(verboseData.child).toEqual(mockNestedVerboseData);
  });

  it("accepts ObjectGenerationRunnable instances directly in nestedInputs", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "Test system prompt for root type",
    });
    const rootInput = { hello: "world" };

    // Create a custom nested runnable to pass directly
    const customNestedRunnable = new ObjectGenerationRunnable(ChildType, {
      model: {} as any,
      systemPrompt: "Custom system prompt for child type",
      inputSchema: ChildGenerationInputSchema,
      outputSchema: z.object({ id: z.number(), custom: z.boolean() }),
    });

    // Spy on the updateSystemPrompt method
    const updateSystemPromptSpy = jest.spyOn(
      customNestedRunnable,
      "updateSystemPrompt"
    );

    // Register schema class and constructor on globalThis
    (globalThis as any).ChildGenerationInputSchema = ChildGenerationInputSchema;
    (globalThis as any).Child = ChildType;

    // Stub zodSchemaRegistry to return schemas for both root and child
    (zodSchemaRegistry.get as jest.Mock).mockImplementation((key) => {
      // For the root type
      if (key === RootType) {
        return z.object({});
      }
      // For the child input schema
      if (key === (globalThis as any).ChildGenerationInputSchema) {
        return ChildGenerationInputSchema;
      }
      // For the child output schema
      if (key === ChildType) {
        return z.object({ id: z.number(), custom: z.boolean() });
      }
      return undefined;
    });

    // Mock the invoke method for both root and custom nested runnable
    invokeSpy.mockImplementation(async (input: any, config: any) => {
      // For root invocation (has exclude property)
      if (config && config.exclude && config.exclude.includes("child")) {
        return { ...rootInput, generated: true };
      }

      // For nested invocation, return a custom result
      return { id: 5, custom: true };
    });

    // Pass the custom runnable directly in nestedInputs
    const nestedInputs = { child: customNestedRunnable };
    const result = await composite.invoke(rootInput, nestedInputs);

    // Verify the invoke was called twice (root and nested)
    expect(invokeSpy).toHaveBeenCalledTimes(2);

    // Verify updateSystemPrompt was called to add parent context
    expect(updateSystemPromptSpy).toHaveBeenCalledTimes(1);
    expect(updateSystemPromptSpy).toHaveBeenCalledWith(
      expect.stringContaining("part of a larger RootType object")
    );

    // Verify the nested result was merged correctly
    expect(result).toEqual({
      hello: "world",
      generated: true,
      child: { id: 5, custom: true },
    });
  });
});
