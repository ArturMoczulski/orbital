import { AreaGenerator, AreaGenerationPrompt } from "./area-generator";
// Increase Jest timeout for long-running LLM calls
jest.setTimeout(60000);
import { Area, Position } from "@orbital/core";
import { createTestLogger } from "@orbital/testing";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import {
  setupOllamaTest,
  createLLMObjectGenerationService,
  LLMObjectGenerationService,
} from "@orbital/llm";

/**
 * E2E tests for AreaGenerator using a real LLM (Ollama).
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai/
 * 2. Run a model: `ollama run llama3.1` or any other model you prefer
 */
describe("E2E: AreaGenerator", () => {
  let generator: AreaGenerator;
  let model: BaseLanguageModel;
  let service: LLMObjectGenerationService;

  // Set up the test environment with Ollama
  // Create a logger for test output
  const testLogger = createTestLogger("AreaGeneratorTest");

  beforeAll(async () => {
    // Initialize the model and service with test logger
    model = await setupOllamaTest();

    // Create a test logger that respects VERBOSE_TEST environment variable
    // Add a context prefix to identify logs from this test
    const logger = createTestLogger("AreaGenerator");

    // Create the service with the test logger
    service = createLLMObjectGenerationService(model, {
      logger,
    });

    // Create the generator with the test logger
    generator = new AreaGenerator(model, service, logger);
  });

  it("should generate an area with a real LLM", async () => {
    const prompt: AreaGenerationPrompt = {
      theme: "medieval fantasy",
      mood: "mysterious",
      purpose: "hidden treasure location",
      additionalDetails:
        "This area should have ancient ruins and magical elements.",
    };

    const result = await generator.generateArea(prompt);
    testLogger.info("E2E Generated Area:", result);

    expect(result).toBeInstanceOf(Area);
    expect(result.name).toBeTruthy();
    expect(result.position).toBeInstanceOf(Position);

    testLogger.info("Generated Area:", {
      name: result.name,
      position: {
        x: result.position.x,
        y: result.position.y,
        z: result.position.z,
      },
    });
  }, 60000);

  it("should generate a region with a real LLM", async () => {
    const prompt: AreaGenerationPrompt = {
      theme: "sci-fi space station",
      mood: "abandoned",
      purpose: "exploration",
    };
    const count = 2;

    const result = await generator.generateRegion(prompt, count);
    testLogger.info("E2E Generated Region:", result);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(count);
    expect(result[0]).toBeInstanceOf(Area);
    expect(result[1]).toBeInstanceOf(Area);

    const distance = calculateDistance(result[0].position, result[1].position);
    expect(distance).toBeGreaterThan(0);

    testLogger.info(
      "Generated Region:",
      result.map((area: Area) => ({
        name: area.name,
        position: {
          x: area.position.x,
          y: area.position.y,
          z: area.position.z,
        },
      }))
    );
  }, 60000);
});

// Helper function to calculate distance between two positions
function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
