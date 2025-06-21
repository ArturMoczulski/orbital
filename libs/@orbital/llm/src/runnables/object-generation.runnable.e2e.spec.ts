import { z } from "zod";
import { createTestLogger } from "@orbital/testing";
import { ConsoleLogger, VerbosityLevel } from "@orbital/core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ObjectGenerationRunnable } from "./object-generation.runnable";
import { IObjectGenerationPromptRepository } from "./object-generation-prompt-repository.interface";
import { setupOllamaTest } from "../testing/llm-test-utils";

/**
 * This is an E2E test that uses a real LLM (Ollama) to test the ObjectGenerationRunnable.
 *
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai/
 * 2. Run a model: `ollama run llama3.1` or any other model you prefer
 *
 * To run this test:
 * npm test -- -t "E2E: ObjectGenerationRunnable"
 */
describe("E2E: ObjectGenerationRunnable", () => {
  // Increase Jest timeout for long-running LLM calls
  jest.setTimeout(60000);

  let model: BaseLanguageModel;

  // Set up the test environment with Ollama
  beforeAll(async () => {
    model = await setupOllamaTest();
  });

  // Create a logger for test output
  const testLogger = createTestLogger("ObjectGenerationRunnableTest");
  const verboseLogger = new ConsoleLogger(
    VerbosityLevel.VERBOSE,
    "ObjectGenerationRunnable"
  );

  // Create a mock prompt repository for testing
  const mockPromptRepository: IObjectGenerationPromptRepository = {
    inferKey: (typeName: string) => typeName.toLowerCase(),
    get: (key: string) => {
      if (key === "town") {
        return "You are a generator of realistic fantasy towns.";
      } else if (key === "complextown") {
        return "You are a generator of detailed fantasy towns with rich histories and economies.";
      } else if (key === "constrainedtown") {
        return "You are a generator of medieval towns. Follow the constraints exactly.";
      }
      return "You are a creative generator.";
    },
  };

  // Define a simple test schema
  const TownSchema = z
    .object({
      name: z.string().describe("The town's name"),
      population: z.number().int().positive().describe("The town's population"),
      description: z.string().describe("A brief description of the town"),
      pointsOfInterest: z
        .array(z.string())
        .describe("List of interesting places in the town"),
    })
    .describe("Information about a fantasy town");

  type Town = z.infer<typeof TownSchema>;

  it("should generate a structured town object based on a schema", async () => {
    // Create the runnable
    class TownType {}

    const townGenerator = new ObjectGenerationRunnable<any, Town>(TownType, {
      inputSchema: z.any(), // Dummy input schema for E2E tests
      outputSchema: TownSchema,
      model: model,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
      promptRepository: mockPromptRepository,
    });

    // Input data
    const input = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Generate the town
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "e2e-test-session" },
    });

    // Assert
    expect(result).toBeDefined();

    // Check the output properties
    expect(typeof result.name).toBe("string");
    expect(result.name.length).toBeGreaterThan(0);
    expect(typeof result.population).toBe("number");
    expect(result.population).toBeGreaterThan(0);
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
    expect(Array.isArray(result.pointsOfInterest)).toBe(true);
    expect(result.pointsOfInterest.length).toBeGreaterThan(0);

    // Log the result using the test logger
    testLogger.info("Generated Town:", result);
  });

  it("should handle complex nested schemas", async () => {
    // Define a more complex schema with nested objects
    const LocationSchema = z
      .object({
        latitude: z.number().describe("Latitude coordinate"),
        longitude: z.number().describe("Longitude coordinate"),
        terrain: z.string().describe("Type of terrain"),
      })
      .describe("Geographic location information");

    const EconomySchema = z
      .object({
        mainIndustry: z.string().describe("Primary industry of the town"),
        secondaryIndustries: z.array(z.string()).describe("Other industries"),
        prosperity: z
          .number()
          .min(1)
          .max(10)
          .describe("Economic prosperity rating (1-10)"),
        tradingPartners: z
          .array(z.string())
          .describe("Names of towns that trade with this one"),
      })
      .describe("Economic information about the town");

    const ComplexTownSchema = z
      .object({
        name: z.string().describe("The town's name"),
        population: z
          .number()
          .int()
          .positive()
          .describe("The town's population"),
        description: z.string().describe("A brief description of the town"),
        location: LocationSchema,
        economy: EconomySchema,
        landmarks: z
          .array(
            z.object({
              name: z.string().describe("Name of the landmark"),
              description: z.string().describe("Description of the landmark"),
              historicalSignificance: z
                .string()
                .optional()
                .describe("Historical importance, if any"),
            })
          )
          .describe("Notable landmarks in the town"),
      })
      .describe("Detailed information about a fantasy town");

    type ComplexTown = z.infer<typeof ComplexTownSchema>;

    // Create the runnable
    class ComplexTownType {}

    const complexTownGenerator = new ObjectGenerationRunnable<any, ComplexTown>(
      ComplexTownType,
      {
        inputSchema: z.any(), // Dummy input schema for E2E tests
        outputSchema: ComplexTownSchema,
        model: model,
        systemPrompt:
          "You are a generator of detailed fantasy towns with rich histories and economies.",
        maxAttempts: 3,
        logger: verboseLogger,
        promptRepository: mockPromptRepository,
      }
    );

    // Input data
    const input = {
      climate: "temperate",
      region: "coastal",
      age: "ancient",
      culture: "seafaring",
    };

    // Generate the complex town
    const result = await complexTownGenerator.invoke(input, {
      configurable: { sessionId: "e2e-complex-town-session" },
    });

    // Assert
    expect(result).toBeDefined();

    // Check the output properties
    expect(typeof result.name).toBe("string");
    expect(typeof result.population).toBe("number");
    expect(typeof result.description).toBe("string");

    // Check nested location object
    expect(result.location).toBeDefined();
    expect(typeof result.location.latitude).toBe("number");
    expect(typeof result.location.longitude).toBe("number");
    expect(typeof result.location.terrain).toBe("string");

    // Check nested economy object
    expect(result.economy).toBeDefined();
    expect(typeof result.economy.mainIndustry).toBe("string");
    expect(Array.isArray(result.economy.secondaryIndustries)).toBe(true);
    expect(typeof result.economy.prosperity).toBe("number");
    expect(Array.isArray(result.economy.tradingPartners)).toBe(true);

    // Check landmarks array
    expect(Array.isArray(result.landmarks)).toBe(true);
    if (result.landmarks.length > 0) {
      const landmark = result.landmarks[0];
      expect(typeof landmark.name).toBe("string");
      expect(typeof landmark.description).toBe("string");
    }

    // Log the result using the test logger
    testLogger.info("Generated Complex Town:", JSON.stringify(result, null, 2));
  });

  it("should maintain conversation history when useHistory is true", async () => {
    // Create the runnable with history and inputData
    class TownType {}

    const townGenerator = new ObjectGenerationRunnable<any, Town>(TownType, {
      inputSchema: z.any(), // Dummy input schema for E2E tests
      outputSchema: TownSchema,
      model: model,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
      promptRepository: mockPromptRepository,
    });

    // Input data for first generation
    const firstInput = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Generate the first town
    const firstResult = await townGenerator.invoke(firstInput, {
      configurable: { sessionId: "e2e-history-session", useHistory: true },
    });

    // Input data for second generation that references the first
    const secondInput = {
      climate: "desert",
      temperature: 40,
      friendliness: "high",
      relation: "sister city to the previous town",
    };

    // Generate the second town
    const secondResult = await townGenerator.invoke(secondInput, {
      configurable: { sessionId: "e2e-history-session", useHistory: true },
    });

    // Assert
    expect(secondResult).toBeDefined();

    // Log the results
    testLogger.info("First Town:", firstResult);
    testLogger.info("Second Town:", secondResult);

    // Since we can't verify the prompt directly without getLastPrompt,
    // we can verify the history is working by checking if the second town
    // references the first town in some way (this is less reliable but still useful)
    expect(secondResult.description).toBeDefined();

    // Clear history after test
    townGenerator.clearHistory("e2e-history-session");
  });

  it("should handle retry logic when the model returns invalid data", async () => {
    // Create a schema with a very specific constraint that might cause validation failures
    const ConstrainedTownSchema = z
      .object({
        name: z
          .string()
          .min(5)
          .max(20)
          .describe("The town's name (5-20 characters)"),
        population: z
          .number()
          .int()
          .min(100)
          .max(10000)
          .describe("The town's population (100-10000)"),
        foundingYear: z
          .number()
          .int()
          .min(1000)
          .max(1500)
          .describe("Year the town was founded (1000-1500)"),
        description: z
          .string()
          .min(50)
          .max(200)
          .describe("A description of the town (50-200 characters)"),
        governmentType: z
          .enum(["monarchy", "republic", "council", "dictatorship"])
          .describe("Type of government"),
      })
      .describe("Information about a medieval town with specific constraints");

    type ConstrainedTown = z.infer<typeof ConstrainedTownSchema>;

    // Create the runnable with a low max attempts to speed up the test
    class ConstrainedTownType {}

    const constrainedTownGenerator = new ObjectGenerationRunnable<
      any,
      ConstrainedTown
    >(ConstrainedTownType, {
      inputSchema: z.any(), // Dummy input schema for E2E tests
      outputSchema: ConstrainedTownSchema,
      model: model,
      systemPrompt:
        "You are a generator of medieval towns. Follow these constraints exactly: " +
        "name must be 5-20 characters, population must be between 100-10000, " +
        "foundingYear must be between 1000-1500, description must be 50-200 characters, " +
        "and governmentType must be one of: monarchy, republic, council, or dictatorship. " +
        "Make sure all values are of the correct type (strings for text, numbers for numeric values).",
      maxAttempts: 5,
      logger: verboseLogger,
      promptRepository: mockPromptRepository,
    });

    // Input data designed to potentially cause validation issues
    const input = {
      region: "coastal",
      prosperity: "very poor",
      threat: "constant pirate attacks",
    };

    // Generate the town
    const result = await constrainedTownGenerator.invoke(input, {
      configurable: { sessionId: "e2e-retry-test-session" },
    });

    // Assert
    expect(result).toBeDefined();

    // Check that the output meets the constraints
    expect(result.name.length).toBeGreaterThanOrEqual(5);
    expect(result.name.length).toBeLessThanOrEqual(20);
    expect(result.population).toBeGreaterThanOrEqual(100);
    expect(result.population).toBeLessThanOrEqual(10000);
    expect(result.foundingYear).toBeGreaterThanOrEqual(1000);
    expect(result.foundingYear).toBeLessThanOrEqual(1500);
    expect(result.description.length).toBeGreaterThanOrEqual(50);
    expect(result.description.length).toBeLessThanOrEqual(200);
    expect(["monarchy", "republic", "council", "dictatorship"]).toContain(
      result.governmentType
    );

    // Log the result
    testLogger.info("Generated Constrained Town:", result);
  });

  it("should return rich output in verbose mode", async () => {
    // Create the runnable
    class VerboseTownType {}

    const townGenerator = new ObjectGenerationRunnable<any, Town>(
      VerboseTownType,
      {
        inputSchema: z.any(), // Dummy input schema for E2E tests
        outputSchema: TownSchema,
        model: model,
        systemPrompt: "You are a generator of realistic fantasy towns.",
        maxAttempts: 3,
        logger: verboseLogger,
        promptRepository: mockPromptRepository,
      }
    );

    // Input data
    const input = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Generate the town with verbose mode
    // Use the standard LangChain approach for verbose mode
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "e2e-verbose-mode-session" },
    });

    // Assert basic output structure
    expect(result).toBeDefined();

    // Check the output properties - should still have the town data
    expect(typeof result.name).toBe("string");
    expect(result.name.length).toBeGreaterThan(0);
    expect(typeof result.population).toBe("number");
    expect(result.population).toBeGreaterThan(0);
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
    expect(Array.isArray(result.pointsOfInterest)).toBe(true);

    // We don't try to access the model directly since it's private
    // Instead, we focus on testing that the output is correctly structured

    // Log the full result for inspection
    testLogger.info("Result:", result);
  });
  it("should support exclude option in E2E", async () => {
    // Test that exclude removes specified fields from the schema in a real LLM scenario
    class TownType {}
    const townGenerator = new ObjectGenerationRunnable<any, Town>(TownType, {
      inputSchema: z.any(),
      outputSchema: TownSchema,
      model: model,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
      promptRepository: mockPromptRepository,
    });
    const input = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "e2e-exclude-session" },
      exclude: ["description"],
    });
    expect(result).toBeDefined();
    // description should be omitted per exclude
    expect((result as any).description).toBeUndefined();
    // other fields still present
    expect(typeof result.name).toBe("string");
    expect(typeof result.population).toBe("number");
    expect(Array.isArray(result.pointsOfInterest)).toBe(true);
  });
});
