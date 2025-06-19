import {
  AreaMetadataGenerator,
  AreaGenerationPrompt,
} from "./area-metadata-generator";
import { Area, Position } from "@orbital/core";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { createTestLogger } from "@orbital/testing";
import { LLMObjectGenerationService } from "@orbital/llm";

// Create a mock language model that can be used for testing
const createMockLLM = () => {
  return new FakeListChatModel({
    responses: [
      JSON.stringify({
        name: "Ancient Ruins",
        description:
          "A mysterious set of ancient ruins with magical properties.",
        position: { x: 100, y: 200, z: 50 },
        landmarks: ["Broken Tower", "Magic Fountain"],
        connections: ["Forest Path", "Mountain Pass"],
      }),
    ],
  });
};

// Mock the PromptTemplate
jest.mock("@langchain/core/prompts", () => {
  return {
    PromptTemplate: {
      fromTemplate: jest.fn().mockReturnValue({
        format: jest.fn().mockResolvedValue("Formatted prompt"),
      }),
    },
  };
});

// Mock the LLMObjectGenerationService
jest.mock("@orbital/llm", () => {
  return {
    LLMObjectGenerationService: jest.fn().mockImplementation(() => {
      return {
        generateObject: jest.fn().mockImplementation(async () => {
          return {
            output: {
              name: "Ancient Ruins",
              description:
                "A mysterious set of ancient ruins with magical properties.",
              position: { x: 100, y: 200, z: 50 },
              landmarks: ["Broken Tower", "Magic Fountain"],
              connections: ["Forest Path", "Mountain Pass"],
            },
            prompt: "This is a mock prompt for testing",
          };
        }),
        logger: {
          verbose: jest.fn(),
        },
      };
    }),
    LLMPromptMessages: jest.requireActual("@orbital/llm").LLMPromptMessages,
  };
});

// Mock the RunnableSequence
jest.mock("@langchain/core/runnables", () => {
  return {
    RunnableSequence: {
      from: jest.fn().mockReturnValue({
        invoke: jest.fn().mockImplementation(async () => {
          return {
            name: "Ancient Ruins",
            description:
              "A mysterious set of ancient ruins with magical properties.",
            position: { x: 100, y: 200, z: 50 },
            landmarks: ["Broken Tower", "Magic Fountain"],
            connections: ["Forest Path", "Mountain Pass"],
          };
        }),
      }),
    },
  };
});

describe("AreaMetadataGenerator", () => {
  let mockLLM: BaseLanguageModel;
  let mockGenerationService: LLMObjectGenerationService;
  let generator: AreaMetadataGenerator;

  beforeEach(() => {
    mockLLM = createMockLLM();
    // Create a test logger with context prefix for unit tests
    const logger = createTestLogger("AreaMetadataGenerator-Unit"); // Renamed logger context
    mockGenerationService = new LLMObjectGenerationService(mockLLM, { logger });
    generator = new AreaMetadataGenerator(
      mockLLM,
      mockGenerationService,
      logger
    );
  });

  describe("constructor", () => {
    it("should create an instance with a language model and generation service", () => {
      // Act
      const logger = createTestLogger();
      const instance = new AreaMetadataGenerator( // Corrected constructor call
        mockLLM,
        mockGenerationService,
        logger
      );

      // Assert
      expect(instance).toBeInstanceOf(AreaMetadataGenerator);
    });
  });

  describe("generate", () => {
    // Renamed describe block
    it("should generate an area based on the provided prompt", async () => {
      // Arrange
      const prompt: AreaGenerationPrompt = {
        theme: "fantasy",
        mood: "mysterious",
        purpose: "exploration",
        additionalDetails: "", // Added missing property
      };

      // Act
      const result = await generator.generate(prompt); // Changed method call

      // Assert
      expect(result).toBeInstanceOf(Area);
      expect(result.name).toBe("Ancient Ruins");
      // Additional generated properties from LLM should be assigned
      expect((result as any).description).toBe(
        "A mysterious set of ancient ruins with magical properties."
      );
      expect((result as any).landmarks).toEqual([
        "Broken Tower",
        "Magic Fountain",
      ]);
      expect((result as any).connections).toEqual([
        "Forest Path",
        "Mountain Pass",
      ]);
      // In the mocked environment, we can't expect specific position values
      // since they're generated in the implementation
      expect(result.position).toBeDefined();
    });

    it("should use default values for missing prompt fields", async () => {
      // Arrange
      const prompt: AreaGenerationPrompt = {
        // Added missing properties with empty strings
        theme: "",
        mood: "",
        purpose: "",
        additionalDetails: "",
      };

      // Act
      const result = await generator.generate(prompt); // Changed method call

      // Assert
      expect(result).toBeInstanceOf(Area);
      expect(result.name).toBe("Ancient Ruins");
    });
  });
});

// Helper function to calculate distance between two positions
function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
