import { z } from "zod";
import { BaseObject } from "./base-object";
import { faker } from "@faker-js/faker";
import { ZodSchema } from "../decorators/zod-schema.decorator";

/**
 * Represents a three-dimensional position in the world.
 */
export type PositionProps = z.infer<typeof PositionSchema>;

/** Zod schema for Position */
export const PositionSchema = z
  .object({
    x: z
      .number()
      .describe("X coordinate of the position, in meters from origin"),
    y: z
      .number()
      .describe("Y coordinate of the position, in meters from origin"),
    z: z.number().describe("Z coordinate (height), in meters above ground"),
  })
  .describe("3D position in cartesian space");

/**
 * Domain class for Position with auto-assignment and mock factory.
 */
@ZodSchema(PositionSchema)
export class Position
  extends BaseObject<PositionProps>
  implements PositionProps
{
  x: number = 0;
  y: number = 0;
  z: number = 0;

  constructor(data?: Partial<PositionProps>) {
    super(data);

    // Initialize with default values if not provided
    this.x = data?.x ?? 0;
    this.y = data?.y ?? 0;
    this.z = data?.z ?? 0;
  }

  /** Create a fake Position instance */
  static mock(overrides: Partial<PositionProps> = {}): Position {
    return new Position({
      x: faker.number.int({ min: -1000, max: 1000 }),
      y: faker.number.int({ min: -1000, max: 1000 }),
      z: faker.number.int({ min: -1000, max: 1000 }),
      ...overrides,
    });
  }
}
