import { AreaMapGenerator } from "./area-map-generator";
jest.setTimeout(60000);

import { AreaMap } from "@orbital/core";
import { createTestLogger } from "@orbital/testing";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import {
  setupOllamaTest,
  createLLMObjectGenerationService,
  LLMObjectGenerationService,
} from "@orbital/llm";

describe("E2E: AreaMapGenerator", () => {
  let model: BaseLanguageModel;
  let service: LLMObjectGenerationService;
  let generator: AreaMapGenerator;

  const testLogger = createTestLogger("AreaMapGeneratorTest");
  // Null logger to suppress duplicate logs in generator
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
    // Initialize a real LLM (Ollama) for testing
    model = await setupOllamaTest();
    service = createLLMObjectGenerationService(model, { logger: testLogger });
    generator = new AreaMapGenerator(model, service, nullLogger);
  });

  it("should generate a small map with a real LLM", async () => {
    const prompt = {
      width: 5,
      height: 5,
      legend: {
        "~": { terrain: "water", walkable: false },
        ".": { terrain: "dirt", walkable: true },
        X: { terrain: "building", walkable: false },
        "|": { terrain: "tree", walkable: false },
        o: { terrain: "path", walkable: true },
      },
      theme: "medieval village",
      biome: "forest",
      seed: 42,
      additionalDetails: "A small medieval village near a river.",
    };

    const result = await generator.generate(prompt);
    testLogger.info("E2E Generated Map:", result);

    expect(result).toBeInstanceOf(AreaMap);
    expect(typeof result.version).toBe("number");
    expect(typeof result.cellSize).toBe("number");
    expect(Array.isArray(result.grid)).toBe(true);
    expect(result.grid.length).toBe(prompt.height);
    expect(result.grid[0].length).toBe(prompt.width);
    expect(result.legend).toMatchObject(prompt.legend);
  });
});
