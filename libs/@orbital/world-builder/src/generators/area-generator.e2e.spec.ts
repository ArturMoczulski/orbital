import { AreaGenerator, AreaGenerationPrompt } from "./area-generator";
import { Area, Position } from "@orbital/core";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { logVerbose } from "@orbital/testing";

/**
 * This is an E2E test that uses a real LLM (Ollama) to generate areas.
 *
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai/
 * 2. Run a model: `ollama run llama2` or any other model you prefer
 *
 * To run this test:
 * npm test -- -t "E2E: AreaGenerator"
 */
describe("E2E: AreaGenerator", () => {
  let generator: AreaGenerator;

  beforeAll(() => {
    // Create a real Ollama model
    // This assumes Ollama is running locally on the default port
    const ollamaModel = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.1:latest", // Change this to the model you're running
      temperature: 0.7,
    });

    // Create the generator with the real model
    generator = new AreaGenerator({
      model: ollamaModel,
    });
  });

  // Mark as skipped by default to avoid running in CI environments
  // Remove the .skip to run the test locally
  describe("with real LLM", () => {
    it("should generate an area with a real LLM", async () => {
      // Arrange
      const prompt: AreaGenerationPrompt = {
        theme: "medieval fantasy",
        mood: "mysterious",
        purpose: "hidden treasure location",
        additionalDetails:
          "This area should have ancient ruins and magical elements.",
      };

      // Act
      const result = await generator.generateArea(prompt);

      // Log detailed result if verbose mode is enabled
      logVerbose("E2E Generated Area", result);

      // Assert
      expect(result).toBeInstanceOf(Area);
      expect(result.name).toBeTruthy();
      expect(result.position).toBeInstanceOf(Position);

      // Always log a minimal version for quick reference
      console.log("Generated Area:", {
        name: result.name,
        position: {
          x: result.position.x,
          y: result.position.y,
          z: result.position.z,
        },
      });
    }, 30000); // Increase timeout to 30 seconds for LLM processing

    it("should generate a region with a real LLM", async () => {
      // Arrange
      const prompt: AreaGenerationPrompt = {
        theme: "sci-fi space station",
        mood: "abandoned",
        purpose: "exploration",
      };
      const count = 2; // Limit to 2 areas to keep test duration reasonable

      // Act
      const result = await generator.generateRegion(prompt, count);

      // Log detailed result if verbose mode is enabled
      logVerbose("E2E Generated Region", result);

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(count);
      expect(result[0]).toBeInstanceOf(Area);
      expect(result[1]).toBeInstanceOf(Area);

      // Check that areas are positioned relative to each other
      const distance = calculateDistance(
        result[0].position,
        result[1].position
      );
      expect(distance).toBeGreaterThan(0);

      // Always log a minimal version for quick reference
      console.log(
        "Generated Region:",
        result.map((area) => ({
          name: area.name,
          position: {
            x: area.position.x,
            y: area.position.y,
            z: area.position.z,
          },
        }))
      );
    }, 60000); // Increase timeout to 60 seconds for LLM processing
  });
});

// Helper function to calculate distance between two positions
function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
