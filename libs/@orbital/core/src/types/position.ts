import { z } from "zod";
import { BaseObject } from "./base-object";
import { faker } from "@faker-js/faker";

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

/**
 * Domain class for Position with auto-assignment and mock factory.
 */
export class Position extends BaseObject<Position> implements Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  constructor(data?: Partial<Position>) {
    super();
    if (data) {
      // Assign provided data after default initializers
      Object.assign(this, data);
    }
  }

  /** Create a fake Position instance */
  static mock(overrides: Partial<Position> = {}): Position {
    return new Position({
      x: faker.number.int({ min: -1000, max: 1000 }),
      y: faker.number.int({ min: -1000, max: 1000 }),
      z: faker.number.int({ min: -1000, max: 1000 }),
      ...overrides,
    });
  }
}
