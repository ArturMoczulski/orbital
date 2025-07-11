import {
  WorldObject,
  WorldObjectProps,
  WorldObjectSchema,
  ZodSchema,
} from "@orbital/core";
import { z } from "zod";

/**
 * Represents a world object that can move.
 */
export interface MobileProps extends WorldObjectProps {
  currentLocation?: string;
}

/** Zod schema for Mobile */
export const MobileSchema = WorldObjectSchema.extend({
  currentLocation: z
    .string()
    .optional()
    .describe("Current location ID of the mobile object"),
}).describe("A world object that can move");

/**
 * Represents a world object that can move.
 */
@ZodSchema(MobileSchema)
export class Mobile
  extends WorldObject
  implements MobileProps, WorldObjectProps
{
  /** Current location ID of the mobile object */
  currentLocation?: string;

  constructor(data: Partial<MobileProps>) {
    super(data);

    if (data.currentLocation !== undefined) {
      this.currentLocation = data.currentLocation;
    }
  }

  /** Provide default values for mocking a Mobile */
  static mockDefaults(): Partial<MobileProps> {
    return {
      ...super.mockDefaults(),
      currentLocation: undefined,
    };
  }
}
