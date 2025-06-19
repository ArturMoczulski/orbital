import { AreaGenerator, AreaGenerationPrompt } from "./area-generator";
import { RegionGenerator } from "./region-generator";
// Increase Jest timeout for long-running LLM calls
jest.setTimeout(60000);
import { Area, Position, VerbosityLevel } from "@orbital/core";
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
  let areaGenerator: AreaGenerator;
  let regionGenerator: RegionGenerator;
  let model: BaseLanguageModel;
  let service: LLMObjectGenerationService;

  // Set up the test environment with Ollama
  // Create a logger for test output with VERBOSE level
  const testLogger = createTestLogger("AreaGeneratorTest");

  // Set logger to VERBOSE level to see all logs
  testLogger.setVerbosityLevel(VerbosityLevel.VERBOSE);

  // Create a null logger to prevent duplicate logging
  const nullLogger = {
    error: () => {},
    warn: () => {},
    log: () => {},
    info: () => {},
    debug: () => {},
    verbose: () => {},
    setVerbosityLevel: () => {},
    getVerbosityLevel: () => 0,
  };

  beforeAll(async () => {
    // Initialize the model and service
    model = await setupOllamaTest();

    // Create the service with the test logger
    service = createLLMObjectGenerationService(model, {
      logger: testLogger,
    });

    // Create the generators with a null logger to prevent duplicate logging
    // This way only the LLM service will log the prompts and responses
    areaGenerator = new AreaGenerator(model, service, nullLogger);
    regionGenerator = new RegionGenerator(
      model,
      service,
      nullLogger,
      areaGenerator
    );
  });

  it("should generate an area with a real LLM", async () => {
    const prompt: AreaGenerationPrompt = {
      theme: "medieval fantasy",
      mood: "mysterious",
      purpose: "hidden treasure location",
      additionalDetails:
        "This area should have ancient ruins and magical elements.",
    };

    // Generate the area
    const result = await areaGenerator.generate(prompt);

    // Log the final result
    testLogger.info("E2E Generated Area:", result);

    expect(result).toBeInstanceOf(Area);
    expect(result.name).toBeTruthy();
    expect(result.position).toBeInstanceOf(Position);

    // Ensure all generated properties are populated
    expect(typeof (result as any).description).toBe("string");
    expect(Array.isArray((result as any).landmarks)).toBe(true);
    expect((result as any).landmarks.length).toBeGreaterThan(0);
    expect(Array.isArray((result as any).connections)).toBe(true);
    expect((result as any).connections.length).toBeGreaterThan(0);
  }, 60000);

  it("should generate a region with a real LLM", async () => {
    const prompt: AreaGenerationPrompt = {
      theme: "sci-fi space station",
      mood: "abandoned",
      purpose: "exploration",
    };
    const count = 2;

    // Generate the region
    const result = await regionGenerator.generate({
      ...prompt,
      areaCount: count,
    });

    // Log the final result
    testLogger.info("E2E Generated Region:", result);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(count);
    expect(result[0]).toBeInstanceOf(Area);
    expect(result[1]).toBeInstanceOf(Area);

    const distance = calculateDistance(result[0].position, result[1].position);
    expect(distance).toBeGreaterThan(0);

    // Ensure generated areas include full properties
    for (const area of result) {
      expect(typeof (area as any).description).toBe("string");
      expect(Array.isArray((area as any).landmarks)).toBe(true);
      expect((area as any).landmarks.length).toBeGreaterThan(0);
      expect(Array.isArray((area as any).connections)).toBe(true);
      expect((area as any).connections.length).toBeGreaterThan(0);
    }
  }, 60000);
});

// Helper function to calculate distance between two positions
function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
