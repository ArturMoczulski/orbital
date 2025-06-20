import { z } from "zod";
import { randomUUID } from "crypto";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
} from "./identifiable-object";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { AreaMapTiles } from "./area-map-tiles";

/**
 * Zod schema for AreaMapGrid
 */
export const AreaMapGridSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Unique identifier for the map instance"),
    width: z.number().int().min(1).describe("Width of the map in cells"),
    height: z.number().int().min(1).describe("Height of the map in cells"),
    grid: z
      .array(z.array(z.nativeEnum(AreaMapTiles)))
      .describe("2D grid of map tiles"),
  })
  .describe("A map of an area with a grid of tiles");

/** Type for AreaMapGrid properties */
export type AreaMapGridProps = z.infer<typeof AreaMapGridSchema>;

/**
 * Domain class for AreaMapGrid with auto-assignment and validation.
 */
@ZodSchema(AreaMapGridSchema)
export class AreaMapGrid
  extends IdentifiableObject
  implements AreaMapGridProps, IdentifiableObjectProps
{
  width: number = 0;
  height: number = 0;
  grid: AreaMapTiles[][] = [];

  /** Create a mock AreaMapGrid instance */
  static mock(overrides: Partial<AreaMapGridProps> = {}): AreaMapGrid {
    const width = overrides.width || 3;
    const height = overrides.height || 3;
    const grid =
      overrides.grid ||
      Array(height).fill(Array(width).fill(AreaMapTiles.GrassGround));

    const base: Partial<AreaMapGridProps> = {
      width,
      height,
      grid,
    };
    return new AreaMapGrid({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    // Validate input against schema
    const validated = AreaMapGridSchema.parse(data);
    const id = (validated as any).id || randomUUID();
    super({ id });

    // Assign validated properties
    this.width = validated.width;
    this.height = validated.height;
    this.grid = validated.grid;
  }
}

/**
 * Zod schema for area map generation input
 */
export const AreaMapGenerationInputSchema = z
  .object({
    /** Size of the map */
    size: z
      .string()
      .describe("Size of the map (e.g., 'small', 'medium', 'large')"),
    /** Description of the map */
    description: z.string().describe("Detailed description of the map"),
  })
  .describe("Input schema for area map generation");

/** Type for area map generation input */
export type AreaMapGenerationInputProps = z.infer<
  typeof AreaMapGenerationInputSchema
>;

/**
 * Input class for area map generation
 */
@ZodSchema(AreaMapGenerationInputSchema)
export class AreaMapGenerationInput implements AreaMapGenerationInputProps {
  /** Size of the map */
  size: string = "";
  /** Description of the map */
  description: string = "";

  constructor(data?: Partial<AreaMapGenerationInputProps>) {
    if (data) {
      const validated = AreaMapGenerationInputSchema.parse(data);
      this.size = validated.size;
      this.description = validated.description;
    }
  }
}
