import { z } from "zod";
import { randomUUID } from "crypto";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
} from "./identifiable-object";
import { ZodSchema } from "../decorators/zod-schema.decorator";

/**
 * Zod schema for map generation input
 */
export const MapGenerationInputSchema = z
  .object({
    /** Width of the map in cells */
    width: z.number().int().min(1).describe("Width of the map in cells"),
    /** Height of the map in cells */
    height: z.number().int().min(1).describe("Height of the map in cells"),
    /** Legend mapping symbols to tile properties */
    legend: z
      .record(
        z.object({
          terrain: z.string().describe("Terrain type"),
          walkable: z
            .boolean()
            .describe("Whether this terrain type is walkable"),
          elevation: z
            .number()
            .optional()
            .describe("Elevation of this terrain type"),
        })
      )
      .describe("Legend mapping symbols to tile properties"),
    /** Theme of the map */
    theme: z.string().default("fantasy").describe("Theme of the map"),
    /** Biome type of the map */
    biome: z.string().optional().describe("Biome type of the map"),
    /** Random seed for generation */
    seed: z.number().optional().describe("Random seed for generation"),
    /** Any additional details or constraints */
    additionalDetails: z
      .string()
      .optional()
      .default("")
      .describe("Additional details or constraints"),
  })
  .describe("Input schema for map generation");

/** Type for map generation prompt */
export type MapGenerationPrompt = z.infer<typeof MapGenerationInputSchema>;

/**
 * Intermediate Representation (IR) for a game area map.
 */
export const AreaMapSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Unique identifier for the map instance"),
    grid: z
      .array(z.string())
      .describe("Array of strings, each representing a row of the map grid"),
  })
  .describe("Complete IR data for a game area map");

/** Type for map IR properties */
export type AreaMapProps = z.infer<typeof AreaMapSchema>;

/**
 * Domain class for AreaMap with auto-assignment and validation.
 */
@ZodSchema(AreaMapSchema)
export class AreaMap
  extends IdentifiableObject
  implements AreaMapProps, IdentifiableObjectProps
{
  version: number = 1;
  cellSize: number = 1.0;
  legend: Record<
    string,
    { terrain: string; walkable: boolean; elevation?: number }
  > = {};
  grid: string[] = [];
  metadata?: { biome?: string; seed?: number; description?: string };

  /** Create a mock AreaMap instance */
  static mock(overrides: Partial<AreaMapProps> = {}): AreaMap {
    const base: Partial<AreaMapProps> = {
      grid: ["...", "...", "..."],
    };
    return new AreaMap({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    // Validate input against schema
    const validated = AreaMapSchema.parse(data);
    const id = (validated as any).id || randomUUID();
    super({ id });

    // Assign validated properties
    this.grid = validated.grid;
  }
}
