/* libs/@orbital/llm/src/runnables/area-metadata-generation.runnable.unit.spec.ts */

import { ConsoleLogger, VerbosityLevel } from "@orbital/core";
import { z } from "zod";
import { AIMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import {
  AreaMetadataGenerationRunnable,
  AreaMetadataGenerationRunnableOptions,
} from "./area-metadata-generation.runnable";
import { ObjectGenerationRunnableOptions } from "./object-generation.runnable";
import {
  AreaGenerationInputSchema,
  GeneratedAreaSchema,
} from "@orbital/world-builder/src/generators";

// Infer the AreaGenerationPrompt type from the schema
type AreaGenerationPrompt = z.infer<typeof AreaGenerationInputSchema>;

// Create a verbose logger for tests
const verboseLogger = new ConsoleLogger(
  VerbosityLevel.VERBOSE,
  "AreaMetadataGenerationRunnableTest"
);

// Mock the OutputFixingParser
jest.mock("langchain/output_parsers", () => {
  return {
    OutputFixingParser: {
      fromLLM: jest.fn().mockReturnValue({
        parse: jest.fn().mockImplementation(async (text) => {
          // Return a valid area object
          return {
            name: "Ancient Ruins",
            position: { x: 100, y: 50, z: 0 },
            description:
              "Crumbling stone structures with ancient symbols etched into weathered pillars.",
            landmarks: [
              "Broken statue of a forgotten deity",
              "Hidden chamber with mysterious glyphs",
              "Overgrown courtyard with a dried fountain",
            ],
            connections: [
              "Forest Path",
              "Mountain Pass",
              "Underground Catacombs",
            ],
          };
        }),
      }),
    },
  };
});

describe("AreaMetadataGenerationRunnable", () => {
  // Create a very simple mock LLM
  const createMockLLM = () => {
    return {
      invoke: jest.fn().mockResolvedValue(
        new AIMessage({
          content: JSON.stringify({
            name: "Ancient Ruins",
            position: { x: 100, y: 50, z: 0 },
            description:
              "Crumbling stone structures with ancient symbols etched into weathered pillars.",
            landmarks: [
              "Broken statue of a forgotten deity",
              "Hidden chamber with mysterious glyphs",
              "Overgrown courtyard with a dried fountain",
            ],
            connections: [
              "Forest Path",
              "Mountain Pass",
              "Underground Catacombs",
            ],
          }),
        })
      ),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate area metadata based on the schema", async () => {
    // Create the mock LLM
    const mockLLM = createMockLLM();

    // Create the runnable
    const areaGenerator = new AreaMetadataGenerationRunnable({
      model: mockLLM as unknown as BaseLanguageModel,
      logger: verboseLogger,
      maxAttempts: 3,
      // These are technically provided by the AreaMetadataGenerationRunnable constructor,
      // but TypeScript still requires them in the options object
      inputSchema: AreaGenerationInputSchema as any, // Use type assertion to bypass type checking
      outputSchema: GeneratedAreaSchema,
      systemPrompt: "You are a creative video game world designer.",
    });

    // Input data
    const input: AreaGenerationPrompt = {
      theme: "ancient",
      mood: "mysterious",
      purpose: "exploration",
      additionalDetails: "Contains ancient artifacts and hidden treasures",
    };

    // Generate the area
    const result = await areaGenerator.invoke(input, {
      configurable: { sessionId: "test-session" },
    });

    // Verify the result
    expect(result.output).toEqual({
      name: "Ancient Ruins",
      position: { x: 100, y: 50, z: 0 },
      description:
        "Crumbling stone structures with ancient symbols etched into weathered pillars.",
      landmarks: [
        "Broken statue of a forgotten deity",
        "Hidden chamber with mysterious glyphs",
        "Overgrown courtyard with a dried fountain",
      ],
      connections: ["Forest Path", "Mountain Pass", "Underground Catacombs"],
    });
    expect(result.prompt).toBeDefined();
  });

  it("should include inputData in the prompt when provided", async () => {
    // Create the mock LLM with a spy on invoke
    const mockLLM = createMockLLM();
    const invokeSpy = jest.spyOn(mockLLM, "invoke");

    // Input data
    const input: AreaGenerationPrompt = {
      theme: "ancient",
      mood: "mysterious",
      purpose: "exploration",
      additionalDetails: "",
    };

    // Static input data to be included in the constructor
    const staticInputData: AreaGenerationPrompt = {
      theme: "fantasy",
      mood: "eerie",
      purpose: "boss battle",
      additionalDetails: "A challenging area with a powerful enemy",
    };

    // Create the runnable with inputData
    const areaGenerator = new AreaMetadataGenerationRunnable({
      model: mockLLM as unknown as BaseLanguageModel,
      logger: verboseLogger,
      maxAttempts: 3,
      inputData: staticInputData,
      // These are technically provided by the AreaMetadataGenerationRunnable constructor,
      // but TypeScript still requires them in the options object
      inputSchema: AreaGenerationInputSchema as any, // Use type assertion to bypass type checking
      outputSchema: GeneratedAreaSchema,
      systemPrompt: "You are a creative video game world designer.",
    });

    // Generate the area
    const result = await areaGenerator.invoke(input, {
      configurable: { sessionId: "test-input-data-session" },
    });

    // Verify the result
    expect(result.output).toEqual({
      name: "Ancient Ruins",
      position: { x: 100, y: 50, z: 0 },
      description:
        "Crumbling stone structures with ancient symbols etched into weathered pillars.",
      landmarks: [
        "Broken statue of a forgotten deity",
        "Hidden chamber with mysterious glyphs",
        "Overgrown courtyard with a dried fountain",
      ],
      connections: ["Forest Path", "Mountain Pass", "Underground Catacombs"],
    });

    // Check that the LLM was called with messages containing the inputData
    expect(invokeSpy).toHaveBeenCalled();
    const messages = invokeSpy.mock.calls[0][0];

    // Convert messages to string to check content
    const messagesStr = JSON.stringify(messages);

    // Verify inputData is included in the prompt
    expect(messagesStr).toContain("RAW INPUT DATA");
    expect(messagesStr).toContain("fantasy");
    expect(messagesStr).toContain("eerie");
    expect(messagesStr).toContain("boss battle");
  });
});
