import { z } from "zod";
import { AreaMapGenerator } from "./area-map-generator";
import {
  MapGenerationInputSchema,
  AreaMapSchema,
  AreaMap,
} from "@orbital/core";
import { LLMObjectGenerationService } from "@orbital/llm";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { createTestLogger } from "@orbital/testing";
import { Logger } from "@orbital/core";

/**
 * Unit tests for AreaMapGenerator
 */
describe("AreaMapGenerator", () => {
  let mockService: jest.Mocked<LLMObjectGenerationService>;
  let mockModel: BaseLanguageModel;
  let generator: AreaMapGenerator;
  let logger: Logger;

  beforeEach(() => {
    mockService = { generateObject: jest.fn() } as any;
    mockModel = {} as any;
    logger = createTestLogger("AreaMapGenerator-Unit");
    generator = new AreaMapGenerator(mockModel, mockService, logger);
  });

  it("should validate input schema", async () => {
    const invalidInput = { width: "not a number" } as any;
    await expect(generator.generate(invalidInput)).rejects.toThrow(z.ZodError);
  });

  it("should use default values from the input schema", async () => {
    const input = {
      width: 3,
      height: 3,
      legend: { ".": { terrain: "dirt", walkable: true } },
    };
    // Mock generateObject to return a valid AreaMapProps shape
    const exampleMap = AreaMap.mock();
    mockService.generateObject.mockResolvedValue({
      output: exampleMap,
      prompt: "",
    });
    await generator.generate(input as any);

    // Expect generateObject called with the domain schema and example
    expect(mockService.generateObject).toHaveBeenCalledWith(
      AreaMapSchema,
      expect.any(Function),
      AreaMap.mock()
    );

    // Verify messagesBuilder includes default values
    const messagesBuilder = mockService.generateObject.mock.calls[0][1] as (
      retry: number
    ) => any;
    const messages = messagesBuilder(0);
    expect(messages.human.content).toContain("Guidance details:");
    // Default theme is "fantasy" and additionalDetails default to ""
    const validatedInput = {
      width: 3,
      height: 3,
      legend: { ".": { terrain: "dirt", walkable: true } },
      theme: "fantasy",
      biome: undefined,
      seed: undefined,
      additionalDetails: "",
    };
    expect(messages.human.content).toContain(
      JSON.stringify(validatedInput, null, 2)
    );
  });
});
