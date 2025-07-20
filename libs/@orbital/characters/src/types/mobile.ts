import {
  WorldObject,
  WorldObjectProps,
  WorldObjectSchema,
  ZodSchema,
} from "@orbital/core";
import { z } from "zod";

/** Zod schema for Mobile */
export const MobileSchema = WorldObjectSchema.extend({
  currentLocation: z
    .string()
    .optional()
    .describe("Current location ID of the mobile object"),
}).describe("A world object that can move");

/**
 * Interface for Mobile properties, inferred from the schema
 */
export type MobileProps = z.infer<typeof MobileSchema>;

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
