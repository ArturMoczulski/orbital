import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import { LLMObjectGenerationService } from "./llm-object-generation.service";

// Create a mock for the BaseLanguageModel
const createMockLLM = (responses: string[]) => {
  let currentResponse = 0;

  return {
    invoke: jest.fn().mockImplementation(async () => {
      const content = responses[currentResponse];
      currentResponse = (currentResponse + 1) % responses.length;
      return new AIMessage({ content });
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
    // Mock LLM that returns valid JSON
    const mockLLM = createMockLLM([
      JSON.stringify({
        name: "Test User",
        age: 30,
        isActive: true,
      }),
    ]);

    const service = new LLMObjectGenerationService(mockLLM as any);
    const result = await service.generateObject<TestObject>(
      TestSchema,
      buildMessages
    );

    expect(result).toEqual({
      name: "Test User",
      age: 30,
      isActive: true,
    });
  });

  it("should retry when the LLM returns invalid JSON and succeed on a valid response", async () => {
    // Mock LLM that returns invalid JSON first, then valid JSON
    const mockLLM = createMockLLM([
      "Invalid JSON",
      JSON.stringify({
        name: "Test User",
        age: 30,
        isActive: true,
      }),
    ]);

    const service = new LLMObjectGenerationService(mockLLM as any, {
      logErrors: false,
    });
    const result = await service.generateObject<TestObject>(
      TestSchema,
      buildMessages
    );

    expect(result).toEqual({
      name: "Test User",
      age: 30,
      isActive: true,
    });
  });

  it("should throw an error after maximum retries", async () => {
    // Mock LLM that always returns invalid JSON
    const mockLLM = createMockLLM(["Invalid JSON"]);

    const service = new LLMObjectGenerationService(mockLLM as any, {
      maxRetries: 2,
      logErrors: false,
    });

    await expect(
      service.generateObject<TestObject>(TestSchema, buildMessages)
    ).rejects.toThrow("Failed to generate valid object after 2 attempts");
  });
});
