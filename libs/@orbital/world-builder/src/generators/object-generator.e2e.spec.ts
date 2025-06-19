import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z, ZodSchema } from "zod";
import { createTestLogger } from "@orbital/testing";
import {
  LLMObjectGenerationService,
  LLMPromptMessages,
  setupOllamaTest,
  createLLMObjectGenerationService,
} from "@orbital/llm";
import {
  ObjectGenerator,
  ObjectGeneratorInputSchema,
} from "./object-generator";
import { Logger } from "@orbital/core";

// Increase Jest timeout for long-running LLM calls
jest.setTimeout(60000);

// Define simple schemas for testing
const TestOutputSchema = z.object({
  animal: z.string().describe("The name of an animal"),
  habitat: z.string().describe("The animal's natural habitat"),
  diet: z.array(z.string()).describe("List of foods the animal eats"),
});

type TestOutput = z.infer<typeof TestOutputSchema>;

const TestInputSchema = ObjectGeneratorInputSchema.extend({
  animalType: z.string().describe("The type of animal to generate"),
  environment: z.string().describe("The environment the animal lives in"),
});

type TestInput = z.infer<typeof TestInputSchema>;

// Create a concrete implementation of ObjectGenerator for E2E testing
class TestObjectGeneratorE2E extends ObjectGenerator<TestOutput, TestInput> {
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
    return { animal: "Lion", habitat: "Savanna", diet: ["Meat"] };
  }

  protected instructions(
    promptData: TestInput,
    retryCount: number = 0
  ): LLMPromptMessages {
    const systemContent = `You are a helpful assistant that generates information about animals.`;
    const humanContent = `Generate information about a fictional ${promptData.animalType} that lives in a ${promptData.environment}.`;
    return {
      system: new SystemMessage(systemContent),
      human: new HumanMessage(humanContent),
    };
  }
}

describe("E2E: ObjectGenerator", () => {
  let model: BaseLanguageModel;
  let llmGenerationService: LLMObjectGenerationService;
  let testGenerator: TestObjectGeneratorE2E;
  let testLogger: Logger;

  // Set up the test environment with Ollama
  beforeAll(async () => {
    model = await setupOllamaTest();
    // Create a test logger with context prefix
    const logger = createTestLogger("ObjectGeneratorE2E");
    llmGenerationService = createLLMObjectGenerationService(model, { logger });
    testGenerator = new TestObjectGeneratorE2E(
      model,
      llmGenerationService,
      logger
    );
    testLogger = createTestLogger("ObjectGeneratorE2ETest");
  });

  it("should generate a structured object using the ObjectGenerator", async () => {
    const input: TestInput = {
      animalType: "aquatic creature",
      environment: "deep sea",
    };

    const result = await testGenerator.generate(input);

    // Assert that the result is defined and matches the schema structure
    expect(result).toBeDefined();
    expect(typeof result.animal).toBe("string");
    expect(result.animal.length).toBeGreaterThan(0);
    expect(typeof result.habitat).toBe("string");
    expect(result.habitat.length).toBeGreaterThan(0);
    expect(Array.isArray(result.diet)).toBe(true);
    expect(result.diet.length).toBeGreaterThan(0);

    // Optional: Log the generated object
    testLogger.info("Generated Object:", result);
  });
});
