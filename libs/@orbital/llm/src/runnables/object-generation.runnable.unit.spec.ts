// Inject a verbose logger for testing
import { ConsoleLogger, VerbosityLevel } from "@orbital/core";
import { z } from "zod";
import { AIMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ObjectGenerationRunnable } from "./object-generation.runnable";

// Create a verbose logger for all tests
const verboseLogger = new ConsoleLogger(
  VerbosityLevel.VERBOSE,
  ObjectGenerationRunnable.name
);

// Mock the OutputFixingParser
jest.mock("langchain/output_parsers", () => {
  return {
    OutputFixingParser: {
      fromLLM: jest.fn().mockReturnValue({
        parse: jest.fn().mockImplementation(async (text) => {
          // For the invalid JSON test
          if (text === "This is not valid JSON") {
            // Return a valid object instead of throwing an error
            return {
              name: "Frostmere",
              population: 217,
              description: "A small, cold town with unfriendly inhabitants",
              pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
            };
          }

          // For the invalid schema test (population as string)
          if (text.includes('"population":"217"')) {
            return {
              name: "Frostmere",
              population: 217, // Convert to number
              description: "A small, cold town with unfriendly inhabitants",
              pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
            };
          }

          // Default case - return valid object
          return {
            name: "Frostmere",
            population: 217,
            description: "A small, cold town with unfriendly inhabitants",
            pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
          };
        }),
      }),
    },
  };
});

describe("ObjectGenerationRunnable", () => {
  // Define a simple schema for testing
  const townSchema = z.object({
    name: z.string(),
    population: z.number(),
    description: z.string(),
    pointsOfInterest: z.array(z.string()),
  });

  // Define a type for the input
  interface TownInput {
    climate: string;
    temperature: number;
    friendliness: "low" | "medium" | "high";
  }

  // Create a very simple mock LLM
  const createMockLLM = () => {
    return {
      invoke: jest.fn().mockResolvedValue(
        new AIMessage({
          content: JSON.stringify({
            name: "Frostmere",
            population: 217,
            description: "A small, cold town with unfriendly inhabitants",
            pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
          }),
        })
      ),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to test to ensure our test fallbacks work
    process.env.NODE_ENV = "test";
  });

  it("should generate an object based on the schema", async () => {
    // Create the mock LLM
    const mockLLM = createMockLLM();

    // Create the runnable
    const townGenerator = new ObjectGenerationRunnable<
      TownInput,
      z.infer<typeof townSchema>
    >({
      inputSchema: z.any(), // Dummy input schema for base class tests
      outputSchema: townSchema,
      model: mockLLM as unknown as BaseLanguageModel,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
    });

    // Input data
    const input: TownInput = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Generate the town
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "test-session" },
    });

    // Verify the result
    expect(result.output).toEqual({
      name: "Frostmere",
      population: 217,
      description: "A small, cold town with unfriendly inhabitants",
      pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
    });
    expect(result.prompt).toBeDefined();
  });

  it("should handle invalid JSON using the fixing parser", async () => {
    // Create a mock LLM that returns invalid JSON
    const mockLLM = {
      invoke: jest
        .fn()
        .mockResolvedValue(
          new AIMessage({ content: "This is not valid JSON" })
        ),
    };

    // Create the runnable
    const townGenerator = new ObjectGenerationRunnable<
      TownInput,
      z.infer<typeof townSchema>
    >({
      inputSchema: z.any(), // Dummy input schema for base class tests
      outputSchema: townSchema,
      model: mockLLM as unknown as BaseLanguageModel,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
    });

    // Input data
    const input: TownInput = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Generate the town - should use the fixing parser
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "test-invalid-json" },
    });

    // Verify the result
    expect(result.output).toEqual({
      name: "Frostmere",
      population: 217,
      description: "A small, cold town with unfriendly inhabitants",
      pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
    });
  });

  it("should handle JSON that doesn't match the schema", async () => {
    // Create a mock LLM that returns JSON that doesn't match the schema
    const mockLLM = {
      invoke: jest.fn().mockResolvedValue(
        new AIMessage({
          content: JSON.stringify({
            name: "Frostmere",
            population: "217", // Should be a number
            description: "A small, cold town with unfriendly inhabitants",
            pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
          }),
        })
      ),
    };

    // Create the runnable
    const townGenerator = new ObjectGenerationRunnable<
      TownInput,
      z.infer<typeof townSchema>
    >({
      inputSchema: z.any(), // Dummy input schema for base class tests
      outputSchema: townSchema,
      model: mockLLM as unknown as BaseLanguageModel,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
    });

    // Input data
    const input: TownInput = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Generate the town - should use the fixing parser
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "test-invalid-schema" },
    });

    // Verify the result
    expect(result.output).toEqual({
      name: "Frostmere",
      population: 217,
      description: "A small, cold town with unfriendly inhabitants",
      pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
    });
  });

  it("should include inputData in the prompt when provided", async () => {
    // Create the mock LLM with a spy on invoke
    const mockLLM = createMockLLM();
    const invokeSpy = jest.spyOn(mockLLM, "invoke");

    // Input data
    const input: TownInput = {
      climate: "snowy",
      temperature: -10,
      friendliness: "low",
    };

    // Static input data to be included in the constructor (must match TownInput type)
    const staticInputData: TownInput = {
      climate: "alpine",
      temperature: -15,
      friendliness: "low",
    };

    // Create the runnable with inputData
    const townGenerator = new ObjectGenerationRunnable<
      TownInput,
      z.infer<typeof townSchema>
    >({
      inputSchema: z.any(), // Dummy input schema for base class tests
      outputSchema: townSchema,
      model: mockLLM as unknown as BaseLanguageModel,
      systemPrompt: "You are a generator of realistic fantasy towns.",
      maxAttempts: 3,
      logger: verboseLogger,
      inputData: staticInputData,
    });

    // Generate the town
    const result = await townGenerator.invoke(input, {
      configurable: { sessionId: "test-input-data-session" },
    });

    // Verify the result
    expect(result.output).toEqual({
      name: "Frostmere",
      population: 217,
      description: "A small, cold town with unfriendly inhabitants",
      pointsOfInterest: ["Frozen Lake", "Old Watchtower"],
    });

    // Check that the LLM was called with messages containing the inputData
    expect(invokeSpy).toHaveBeenCalled();
    const messages = invokeSpy.mock.calls[0][0];

    // Convert messages to string to check content
    const messagesStr = JSON.stringify(messages);

    // Verify inputData is included in the prompt
    expect(messagesStr).toContain("RAW INPUT DATA");
    expect(messagesStr).toContain("alpine");
    expect(messagesStr).toContain("temperature");
    expect(messagesStr).toContain("friendliness");
  });
});
