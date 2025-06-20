import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { z } from "zod";
import { createTestLogger } from "@orbital/testing";
import { LLMObjectGenerationService } from "./llm-object-generation.service";

// Create a mock for the BaseLanguageModel
const createMockLLM = (responses: string[], errors?: any[]) => {
  let currentResponse = 0;
  let currentError = 0;
  return {
    invoke: jest.fn().mockImplementation(async () => {
      if (errors && currentError < errors.length) {
        const errorToThrow = errors[currentError];
        currentError++;
        throw errorToThrow;
      }
      if (currentResponse < responses.length) {
        const content = responses[currentResponse];
        currentResponse++;
        return new AIMessage({ content });
      }
      // Fallback if no more responses or errors
      throw new Error("No more mock responses or errors");
    }),
  };
};

describe("LLMObjectGenerationService", () => {
  // Define a test schema
  const TestSchema = z.object({
    name: z.string(),
    age: z.number(),
    isActive: z.boolean(),
  });

  type TestObject = z.infer<typeof TestSchema>;

  // Test messages builder function
  const buildMessages = (retryCount: number) => {
    const systemContent =
      retryCount > 0
        ? "You are a helpful assistant. Your previous response had errors."
        : "You are a helpful assistant.";

    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(
        "Generate a test object with name, age, and isActive properties."
      ),
    };
  };

  it("should successfully generate an object when the LLM returns valid JSON", async () => {
    const mockLLM = createMockLLM([
      JSON.stringify({ name: "Test User", age: 30, isActive: true }),
    ]);
    const logger = createTestLogger("LLMObjectGeneration-Unit");
    const service = new LLMObjectGenerationService(
      mockLLM as unknown as BaseLanguageModel<any, any>,
      { logger }
    );
    const result = await service.generateObject<TestObject>(
      TestSchema,
      buildMessages
    );
    expect(result).toHaveProperty("output");
    expect(result).toHaveProperty("prompt");
    expect(result.output).toEqual({
      name: "Test User",
      age: 30,
      isActive: true,
    });
    expect(typeof result.prompt).toBe("string");
  });

  it("should retry when the LLM returns invalid JSON and succeed on a valid response", async () => {
    const mockLLM = createMockLLM([
      "Invalid JSON",
      JSON.stringify({ name: "Test User", age: 30, isActive: true }),
    ]);
    const logger = createTestLogger("LLMObjectGeneration-Unit");
    const service = new LLMObjectGenerationService(
      mockLLM as unknown as BaseLanguageModel<any, any>,
      { logErrors: false, logger }
    );
    const result = await service.generateObject<TestObject>(
      TestSchema,
      buildMessages
    );
    expect(result).toHaveProperty("output");
    expect(result).toHaveProperty("prompt");
    expect(result.output).toEqual({
      name: "Test User",
      age: 30,
      isActive: true,
    });
  });

  it("should throw an error after maximum retries", async () => {
    const mockLLM = createMockLLM(["Invalid JSON"]);
    const logger = createTestLogger("LLMObjectGeneration-Unit");
    const service = new LLMObjectGenerationService(
      mockLLM as unknown as BaseLanguageModel<any, any>,
      { maxRetries: 2, logErrors: false, logger }
    );
    await expect(
      service.generateObject<TestObject>(TestSchema, buildMessages)
    ).rejects.toThrow("Failed to generate valid object after 2 attempts");
  });

  it("should include validation feedback in human message on retry", async () => {
    // Create a ZodError with multiple validation issues
    const zodError = new z.ZodError([
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["name"],
        message: "Required",
      } as z.ZodIssue,
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["age"],
        message: "Expected number, received string",
      } as z.ZodIssue,
    ]);

    const mockLLM = createMockLLM(
      [JSON.stringify({ name: "Test User", age: 30, isActive: true })], // Response on retry
      [zodError] // Error on first attempt
    );

    const logger = createTestLogger("LLMObjectGeneration-Unit");
    const service = new LLMObjectGenerationService(
      mockLLM as unknown as BaseLanguageModel<any, any>,
      { logErrors: false, logger }
    );

    await service.generateObject<TestObject>(TestSchema, buildMessages);
    expect(mockLLM.invoke).toHaveBeenCalledTimes(2);

    const callArgs = mockLLM.invoke.mock.calls[1][0] as [
      SystemMessage,
      HumanMessage
    ];
    const retryHuman = callArgs[1];

    // The expected content format with multiple issues
    const expectedContent =
      "Generate a test object with name, age, and isActive properties.\n" +
      "Your previous response had errors:\n" +
      JSON.stringify([
        {
          code: "invalid_type",
          path: ["name"],
          message: "Required",
          expected: "string",
          received: "undefined",
        },
        {
          code: "invalid_type",
          path: ["age"],
          message: "Expected number, received string",
          expected: "number",
          received: "string",
        },
      ]);

    // Check that the content matches our expected format exactly
    expect(retryHuman.content).toBe(expectedContent);
  });
  it("should accumulate validation feedback across multiple retry attempts", async () => {
    // Create ZodErrors with different validation issues for each attempt
    const firstAttemptError = new z.ZodError([
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["name"],
        message: "Required",
      } as z.ZodIssue,
    ]);

    const secondAttemptError = new z.ZodError([
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["age"],
        message: "Expected number, received string",
      } as z.ZodIssue,
    ]);

    const mockLLM = createMockLLM(
      [JSON.stringify({ name: "Test User", age: 30, isActive: true })], // Final successful response
      [firstAttemptError, secondAttemptError] // Errors for first and second attempts
    );

    const logger = createTestLogger("LLMObjectGeneration-Unit");
    const service = new LLMObjectGenerationService(
      mockLLM as unknown as BaseLanguageModel<any, any>,
      { logErrors: false, logger }
    );

    await service.generateObject<TestObject>(TestSchema, buildMessages);
    expect(mockLLM.invoke).toHaveBeenCalledTimes(3);

    // Check the content of the third attempt (after two errors)
    const thirdCallArgs = mockLLM.invoke.mock.calls[2][0] as [
      SystemMessage,
      HumanMessage
    ];
    const thirdAttemptHuman = thirdCallArgs[1];

    // Get the actual content from the third attempt
    const actualContent = thirdAttemptHuman.content;

    // Verify that the content includes feedback from both previous attempts
    expect(actualContent).toContain(
      "Generate a test object with name, age, and isActive properties."
    );
    expect(actualContent).toContain("Your previous response had errors:");
    expect(actualContent).toContain('"code":"invalid_type"');
    expect(actualContent).toContain('"path":["name"]');
    expect(actualContent).toContain('"message":"Required"');
    expect(actualContent).toContain('"expected":"string"');
    expect(actualContent).toContain('"received":"undefined"');
    expect(actualContent).toContain('"path":["age"]');
    expect(actualContent).toContain(
      '"message":"Expected number, received string"'
    );
    expect(actualContent).toContain('"expected":"number"');
    expect(actualContent).toContain('"received":"string"');
  });
});
