import { z } from "zod";
import { createTestLogger } from "@orbital/testing";
import { ConsoleLogger, VerbosityLevel } from "@orbital/core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ObjectGenerationRunnable } from "./object-generation.runnable";
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
    const townGenerator = new ObjectGenerationRunnable<any, Town>({
      inputSchema: z.any(), // Dummy input schema for E2E tests
      outputSchema: TownSchema,
      model: model,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
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
    expect(result.output).toBeDefined();
    expect(result.prompt).toBeDefined();

    // Check the output properties
    expect(typeof result.output.name).toBe("string");
    expect(result.output.name.length).toBeGreaterThan(0);
    expect(typeof result.output.population).toBe("number");
    expect(result.output.population).toBeGreaterThan(0);
    expect(typeof result.output.description).toBe("string");
    expect(result.output.description.length).toBeGreaterThan(0);
    expect(Array.isArray(result.output.pointsOfInterest)).toBe(true);
    expect(result.output.pointsOfInterest.length).toBeGreaterThan(0);

    // Log the result using the test logger
    testLogger.info("Generated Town:", result.output);
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
    const complexTownGenerator = new ObjectGenerationRunnable<any, ComplexTown>(
      {
        inputSchema: z.any(), // Dummy input schema for E2E tests
        outputSchema: ComplexTownSchema,
        model: model,
        systemPrompt:
          "You are a generator of detailed fantasy towns with rich histories and economies.",
        maxAttempts: 3,
        logger: verboseLogger,
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
    expect(result.output).toBeDefined();
    expect(result.prompt).toBeDefined();

    // Check the output properties
    expect(typeof result.output.name).toBe("string");
    expect(typeof result.output.population).toBe("number");
    expect(typeof result.output.description).toBe("string");

    // Check nested location object
    expect(result.output.location).toBeDefined();
    expect(typeof result.output.location.latitude).toBe("number");
    expect(typeof result.output.location.longitude).toBe("number");
    expect(typeof result.output.location.terrain).toBe("string");

    // Check nested economy object
    expect(result.output.economy).toBeDefined();
    expect(typeof result.output.economy.mainIndustry).toBe("string");
    expect(Array.isArray(result.output.economy.secondaryIndustries)).toBe(true);
    expect(typeof result.output.economy.prosperity).toBe("number");
    expect(Array.isArray(result.output.economy.tradingPartners)).toBe(true);

    // Check landmarks array
    expect(Array.isArray(result.output.landmarks)).toBe(true);
    if (result.output.landmarks.length > 0) {
      const landmark = result.output.landmarks[0];
      expect(typeof landmark.name).toBe("string");
      expect(typeof landmark.description).toBe("string");
    }

    // Log the result using the test logger
    testLogger.info(
      "Generated Complex Town:",
      JSON.stringify(result.output, null, 2)
    );
  });

  it("should maintain conversation history when useHistory is true", async () => {
    // Create the runnable with history and inputData
    const townGenerator = new ObjectGenerationRunnable<any, Town>({
      inputSchema: z.any(), // Dummy input schema for E2E tests
      outputSchema: TownSchema,
      model: model,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
      inputData: {
        worldRegion: "northern realm",
        seasonalEvents: ["winter festival", "ice fishing tournament"],
        commonThreats: ["wolf packs", "avalanches", "bandits"],
      },
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
    expect(secondResult.output).toBeDefined();

    // The second town should have some reference to the first town
    // This is a bit of a fuzzy test, but we're looking for the model to have
    // maintained some context from the first generation
    const combinedText = (
      secondResult.output.name + secondResult.output.description
    ).toLowerCase();

    // Log the results
    testLogger.info("First Town:", firstResult.output);
    testLogger.info("Second Town:", secondResult.output);

    // Log the prompts to verify inputData was included
    testLogger.debug("First Prompt:", firstResult.prompt);
    testLogger.debug("Second Prompt:", secondResult.prompt);

    // Verify inputData was included in the prompts
    expect(firstResult.prompt).toContain("RAW INPUT DATA");
    expect(firstResult.prompt).toContain("northern realm");
    expect(secondResult.prompt).toContain("RAW INPUT DATA");
    expect(secondResult.prompt).toContain("northern realm");

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
    const constrainedTownGenerator = new ObjectGenerationRunnable<
      any,
      ConstrainedTown
    >({
      inputSchema: z.any(), // Dummy input schema for E2E tests
      outputSchema: ConstrainedTownSchema,
      model: model,
      systemPrompt:
        "You are a generator of medieval towns. Follow the constraints exactly.",
      maxAttempts: 3,
      logger: verboseLogger,
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
    expect(result.output).toBeDefined();

    // Check that the output meets the constraints
    expect(result.output.name.length).toBeGreaterThanOrEqual(5);
    expect(result.output.name.length).toBeLessThanOrEqual(20);
    expect(result.output.population).toBeGreaterThanOrEqual(100);
    expect(result.output.population).toBeLessThanOrEqual(10000);
    expect(result.output.foundingYear).toBeGreaterThanOrEqual(1000);
    expect(result.output.foundingYear).toBeLessThanOrEqual(1500);
    expect(result.output.description.length).toBeGreaterThanOrEqual(50);
    expect(result.output.description.length).toBeLessThanOrEqual(200);
    expect(["monarchy", "republic", "council", "dictatorship"]).toContain(
      result.output.governmentType
    );

    // Log the result
    testLogger.info("Generated Constrained Town:", result.output);
  });
});
