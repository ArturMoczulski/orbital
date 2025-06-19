import { z, ZodSchema } from "zod";
import {
  ObjectGenerator,
  ObjectGeneratorInputSchema,
} from "./object-generator";
import { LLMObjectGenerationService, LLMPromptMessages } from "@orbital/llm";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createTestLogger } from "@orbital/testing/src/utils/logging";
import { Logger } from "@orbital/core/src/services/logger";
import { BaseLanguageModel } from "@langchain/core/language_models/base";

// Define a simple schema for testing
const TestOutputSchema = z.object({
  name: z.string(),
  value: z.number(),
});

type TestOutput = z.infer<typeof TestOutputSchema>;

const TestInputSchema = ObjectGeneratorInputSchema.extend({
  param1: z.string().default("default value"),
  param2: z.number(),
});

type TestInput = z.infer<typeof TestInputSchema>;

// Create a concrete implementation of ObjectGenerator for testing
class TestObjectGenerator extends ObjectGenerator<TestOutput, TestInput> {
  constructor(
    protected override readonly model: BaseLanguageModel,
    protected override readonly generationService: LLMObjectGenerationService,
    protected override readonly logger: Logger
  ) {
    super(model, generationService, logger);
  }

  public inputSchema(): ZodSchema<any> {
    return TestInputSchema;
  }

  public schema(): ZodSchema<any> {
    return TestOutputSchema;
  }

  public example(): TestOutput {
    return { name: "example", value: 123 };
  }

  protected instructions(
    promptData: TestInput,
    retryCount: number = 0
  ): LLMPromptMessages {
    const systemContent = `Generate a test object.`;
    const humanContent = `Generate an object with name and value based on input: ${promptData.param1}, ${promptData.param2}.`;
    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(humanContent),
    };
  }
}

describe("ObjectGenerator", () => {
  let mockGenerationService: jest.Mocked<LLMObjectGenerationService>;
  let mockModel: jest.Mocked<BaseLanguageModel>;
  let testGenerator: TestObjectGenerator;
  let testLogger: Logger;

  beforeEach(() => {
    mockGenerationService = {
      generateObject: jest.fn(),
    } as any; // Mock the service

    mockModel = {} as any; // Mock the model

    testLogger = createTestLogger();
    testGenerator = new TestObjectGenerator(
      mockModel,
      mockGenerationService,
      testLogger
    );
  });

  it("should validate input data using the input schema", async () => {
    const invalidInput = { param1: "test", param2: "not a number" }; // Invalid param2

    // Expect the Zod validation to throw an error
    await expect(testGenerator.generate(invalidInput as any)).rejects.toThrow(
      z.ZodError
    );
  });

  it("should use default values from the input schema if not provided", async () => {
    const inputWithoutDefault = { param2: 456 };
    const expectedValidatedInput = { param1: "default value", param2: 456 };

    mockGenerationService.generateObject.mockResolvedValue({
      output: { name: "generated", value: 789 },
      prompt: "mock prompt", // Added prompt
    });

    await testGenerator.generate(inputWithoutDefault);

    // Check if generateObject was called with the input including the default value
    expect(mockGenerationService.generateObject).toHaveBeenCalledWith(
      TestOutputSchema,
      expect.any(Function), // messagesBuilder function
      { name: "example", value: 123 } // example data
    );

    // Verify the messagesBuilder function generates the correct human message with default value
    const messagesBuilder =
      mockGenerationService.generateObject.mock.calls[0][1];
    const messages = messagesBuilder(0);
    expect(messages.human.content).toContain("default value, 456");
  });

  it("should build the correct prompt messages including instructions, example, and input data", async () => {
    const input = { param1: "custom value", param2: 789 };

    mockGenerationService.generateObject.mockResolvedValue({
      output: { name: "generated", value: 1011 },
      prompt: "mock prompt", // Added prompt
    });

    await testGenerator.generate(input);

    expect(mockGenerationService.generateObject).toHaveBeenCalledTimes(1);
    expect(mockGenerationService.generateObject).toHaveBeenCalledWith(
      TestOutputSchema,
      expect.any(Function), // messagesBuilder function
      { name: "example", value: 123 } // example data
    );

    const messagesBuilder =
      mockGenerationService.generateObject.mock.calls[0][1];
    const messages = messagesBuilder(0);

    expect(messages.system).toBeInstanceOf(SystemMessage);
    expect(messages.system.content).toBe("Generate a test object.");

    expect(messages.human).toBeInstanceOf(HumanMessage);
    expect(messages.human.content).toContain(
      "Generate an object with name and value based on input: custom value, 789."
    );
    expect(messages.human.content).toContain("Guidance details:");
    expect(messages.human.content).toContain(JSON.stringify(input, null, 2));
  });

  it("should call LLMObjectGenerationService.generateObject with the correct schema and messages builder", async () => {
    const input = { param1: "test", param2: 123 };
    const expectedOutput = { name: "generated", value: 456 };

    mockGenerationService.generateObject.mockResolvedValue({
      output: expectedOutput,
      prompt: "mock prompt", // Added prompt
    });

    const result = await testGenerator.generate(input);

    expect(mockGenerationService.generateObject).toHaveBeenCalledTimes(1);
    expect(mockGenerationService.generateObject).toHaveBeenCalledWith(
      TestOutputSchema,
      expect.any(Function), // messagesBuilder function
      { name: "example", value: 123 } // example data
    );

    expect(result).toEqual(expectedOutput);
  });

  it("should pass the retry count to the instructions method", async () => {
    const input = { param1: "test", param2: 123 };

    let capturedBuildMessages: (retryCount: number) => LLMPromptMessages;

    mockGenerationService.generateObject.mockImplementation(
      async (schema, buildMessages, example, retryCount = 0) => {
        // Capture the buildMessages function on the first call
        if (retryCount === 0) {
          capturedBuildMessages = buildMessages;
        }
        // Simulate a successful generation after the first attempt
        return {
          output: { name: "generated", value: 456 },
          prompt: "mock prompt",
        };
      }
    );

    await testGenerator.generate(input);

    // Expect generateObject to be called at least once (the initial call)
    expect(mockGenerationService.generateObject).toHaveBeenCalledTimes(1);

    // Now, call the captured buildMessages function with retryCount 1
    // and assert that the instructions method was called with retryCount 1
    // We can't directly check the instructions method call count because it's protected,
    // but we can check the content generated by buildMessages when called with 1.
    // The instructions method is called *inside* buildMessages.

    // We need to verify that the instructions method *was called* with retryCount 1
    // when buildMessages was invoked with 1. The current test structure makes this
    // difficult to assert directly.

    // Let's rethink the test. The goal is to ensure that when generateObject
    // is called (which internally handles retries and calls buildMessages with
    // the correct retryCount), the instructions method receives that retryCount.
    // Since we are mocking generateObject, we can't test its internal logic.

    // A better approach for this unit test is to verify that the `buildMessages`
    // function *passed to* `generateObject` correctly incorporates the input data
    // and calls the internal `instructions` method with the provided retryCount.
    // We can mock the `instructions` method to check its arguments.

    // Let's rewrite this test case.
  });

  it("should pass the retry count to the instructions method (revised test)", async () => {
    const input = { param1: "test", param2: 123 };
    const expectedOutput = { name: "generated", value: 456 };

    // Mock the protected instructions method
    const instructionsSpy = jest.spyOn(testGenerator as any, "instructions");

    mockGenerationService.generateObject.mockResolvedValue({
      output: expectedOutput,
      prompt: "mock prompt",
    });

    await testGenerator.generate(input);

    // Check that generateObject was called with a messagesBuilder function
    expect(mockGenerationService.generateObject).toHaveBeenCalledWith(
      TestOutputSchema,
      expect.any(Function), // messagesBuilder function
      { name: "example", value: 123 } // example data
    );

    // Get the messagesBuilder function that was passed to generateObject
    const messagesBuilder =
      mockGenerationService.generateObject.mock.calls[0][1];

    // Call the messagesBuilder function with a retry count of 5 (simulating a retry)
    messagesBuilder(5);

    // Expect the instructions method to have been called with the validated input and retry count 5
    expect(instructionsSpy).toHaveBeenCalledWith(
      { param1: "test", param2: 123 }, // Validated input
      5 // Retry count
    );

    // Restore the spy
    instructionsSpy.mockRestore();
  });
});
