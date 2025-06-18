import { z } from "zod";
import { Area, AreaSchema, Position } from "@orbital/core";

/**
 * Extended schema for area generation that includes additional fields
 */
export const GeneratedAreaSchema = AreaSchema.extend({
  // Override parentId to allow null values
  parentId: z
    .string()
    .nullable()
    .optional()
    .describe("Identifier of the parent area, if any"),
  description: z.string().describe("A detailed description of the area"),
  landmarks: z
    .array(z.string())
    .describe("Notable landmarks or features in this area"),
  connections: z
    .array(z.string())
    .describe("Names of other areas this area connects to"),
}).describe("Complete area data including description and connections");

/**
 * Type for the generated area data
 */
export type GeneratedAreaData = z.infer<typeof GeneratedAreaSchema>;

/**
 * Creates a mock example of generated area data
 */
export function createExampleAreaData(): GeneratedAreaData {
  const mockArea = Area.mock({
    name: "Ancient Ruins",
    position: new Position({
      x: 100,
      y: 50,
      z: 0,
    }),
  });

  return {
    ...mockArea,
    description:
      "Crumbling stone structures with ancient symbols etched into weathered pillars. Sunlight filters through gaps in the ceiling, illuminating dust particles dancing in the air.",
    landmarks: [
      "Broken statue of a forgotten deity",
      "Hidden chamber with mysterious glyphs",
      "Overgrown courtyard with a dried fountain",
    ],
    connections: ["Forest Path", "Mountain Pass", "Underground Catacombs"],
  };
}
