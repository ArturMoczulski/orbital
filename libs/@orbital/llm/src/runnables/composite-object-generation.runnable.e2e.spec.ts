import { z } from "zod";
import { createTestLogger } from "@orbital/testing";
import { ConsoleLogger, VerbosityLevel, ZodSchema } from "@orbital/core";
import { schemaRegistry } from "@orbital/core/src/registry";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { CompositeObjectGenerationRunnable } from "./composite-object-generation.runnable";
import { setupOllamaTest } from "../testing/llm-test-utils";

/**
 * E2E: CompositeObjectGenerationRunnable
 * Prerequisites:
 * 1. Install Ollama (https://ollama.ai/)
 * 2. Run a model: `ollama run llama3.1`
 */
describe("E2E: CompositeObjectGenerationRunnable", () => {
  jest.setTimeout(300000);

  let model: BaseLanguageModel;
  beforeAll(async () => {
    model = await setupOllamaTest();
  });

  const testLogger = createTestLogger("CompositeE2ETest");
  const verboseLogger = new ConsoleLogger(
    VerbosityLevel.VERBOSE,
    "CompositeE2ETest"
  );

  // Output schemas
  const CitySchema = z.object({
    name: z.string(),
    population: z.number().int().positive(),
    description: z.string(),
    isCapital: z.boolean(),
  });

  const KingdomSchema = z.object({
    name: z.string(),
    ruler: z.string(),
    age: z.union([z.number().int().positive(), z.string()]),
    description: z.string(),
    capital: CitySchema,
    cities: z.array(CitySchema).min(1).max(3),
  });

  // Input schemas
  const KingdomInputSchema = z.object({
    climate: z.string(),
    terrain: z.string(),
    culture: z.string(),
    age: z.string(),
  });

  const CityInputSchema = z.object({
    size: z.string(),
    importance: z.string(),
    specialization: z.string(),
  });

  // Decorated classes for registry
  @ZodSchema(KingdomInputSchema)
  class KingdomGenerator {}

  @ZodSchema(CityInputSchema)
  class CityGenerator {}

  beforeEach(() => {
    schemaRegistry.clear();
    // Re-register the decorated classes
    schemaRegistry.set(KingdomGenerator.name, {
      ctor: KingdomGenerator,
      schema: KingdomInputSchema,
    });
    schemaRegistry.set(CityGenerator.name, {
      ctor: CityGenerator,
      schema: CityInputSchema,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates simple kingdom with capital", async () => {
    const generator = new CompositeObjectGenerationRunnable<any>(
      KingdomGenerator,
      {
        model,
        systemPrompt: "Generate a simple kingdom with capital",
        outputSchema: KingdomSchema,
        logger: verboseLogger,
        maxAttempts: 3,
      }
    );

    const result = await generator.invoke({
      // Root properties
      climate: "temperate",
      terrain: "plains",
      culture: "medieval",
      age: "new",
      // Nested object
      capital: {
        size: "medium",
        importance: "high",
        specialization: "trade",
      },
    });

    expect(typeof result.name).toBe("string");
    expect(result.capital).toBeDefined();
    expect(typeof result.capital.name).toBe("string");
  });

  it("generates kingdom with nested cities", async () => {
    const generator = new CompositeObjectGenerationRunnable<any>(
      KingdomGenerator,
      {
        model,
        systemPrompt: "Generate a kingdom with capital and cities",
        outputSchema: KingdomSchema,
        logger: verboseLogger,
        maxAttempts: 5,
      }
    );

    const result = await generator.invoke({
      // Root properties
      climate: "tropical",
      terrain: "coastal",
      culture: "ancient",
      age: "old",
      // Nested objects
      capital: {
        size: "large",
        importance: "very high",
        specialization: "politics",
      },
      "cities[0]": {
        size: "medium",
        importance: "moderate",
        specialization: "mining",
      },
      "cities[1]": {
        size: "small",
        importance: "low",
        specialization: "farming",
      },
    });

    expect(typeof result.name).toBe("string");
    expect(Array.isArray(result.cities)).toBe(true);
    expect(result.cities.length).toBeGreaterThanOrEqual(1);
  });
});
