import { z } from "zod";
import { BaseObject } from "./base-object";

/**
 * Represents a three-dimensional position in the world.
 */
export interface Position {
  x: number;
  y: number;
  z: number;
}

/** Zod schema for Position */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/** Position class with automatic assignment and Zod validation */
export class Position extends BaseObject<Position> implements Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  constructor(data: unknown) {
    const validated = PositionSchema.parse(data);
    super(validated as Partial<Position>);
  }
}
