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
export const AreaMapSchema = z
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
export type AreaMapProps = z.infer<typeof AreaMapSchema>;

/**
 * Domain class for AreaMapGrid with auto-assignment and validation.
 */
@ZodSchema(AreaMapSchema)
export class AreaMap
  extends IdentifiableObject
  implements AreaMapProps, IdentifiableObjectProps
{
  width: number = 0;
  height: number = 0;
  grid: AreaMapTiles[][] = [];

  /** Create a mock AreaMapGrid instance */
  static mock(overrides: Partial<AreaMapProps> = {}): AreaMap {
    const width = overrides.width || 3;
    const height = overrides.height || 3;
    const grid =
      overrides.grid ||
      Array(height).fill(Array(width).fill(AreaMapTiles.GrassGround));

    const base: Partial<AreaMapProps> = {
      width,
      height,
      grid,
    };
    return new AreaMap({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    // Validate input against schema
    const validated = AreaMapSchema.parse(data);
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
    /** Mapping of tile type names to numeric values */
    tiles: z
      .record(z.string(), z.number())
      .describe("Mapping of tile type names to numeric values"),
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
  /** Mapping of tile type names to numeric values */
  tiles: Record<string, number> = {};

  constructor(data?: Partial<AreaMapGenerationInputProps>) {
    if (data) {
      const validated = AreaMapGenerationInputSchema.parse(data);
      this.size = validated.size;
      this.description = validated.description;
      this.tiles = validated.tiles;
    }
  }

  /**
   * Parse the size string into width and height values
   * @returns An object with width and height properties
   */
  parseSize(): { width: number; height: number } {
    // Default size if parsing fails
    const defaultSize = { width: 32, height: 32 };

    if (!this.size) return defaultSize;

    // Try to parse formats like "32x32", "32X32", "32,32", "32 32"
    const match = this.size.match(/(\d+)\s*[xX,\s]\s*(\d+)/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      return { width, height };
    }

    // Try to parse single number formats like "32" (square map)
    const singleNumber = parseInt(this.size, 10);
    if (!isNaN(singleNumber)) {
      return { width: singleNumber, height: singleNumber };
    }

    // Handle text sizes
    const sizeMap: Record<string, { width: number; height: number }> = {
      small: { width: 16, height: 16 },
      medium: { width: 32, height: 32 },
      large: { width: 64, height: 64 },
      huge: { width: 128, height: 128 },
    };

    const normalizedSize = this.size.toLowerCase().trim();
    return sizeMap[normalizedSize] || defaultSize;
  }
}
