import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  IdentifiableObjectSchema,
} from "./identifiable-object";

/**
 * Represents an object that belongs to a specific world.
 */
export type WorldObjectProps = z.infer<typeof WorldObjectSchema>;

/** Zod schema for WorldObject */
export const WorldObjectSchema = IdentifiableObjectSchema.extend({
  worldId: z
    .string()
    .describe("Identifier of the world this object belongs to"),
}).describe("An object that belongs to a specific world");

/**
 * Domain class for WorldObject with auto-assignment and validation.
 * Extends IdentifiableObject to add a worldId property.
 */
@ZodSchema(WorldObjectSchema)
export class WorldObject
  extends IdentifiableObject
  implements WorldObjectProps, IdentifiableObjectProps
{
  /** Identifier of the world this object belongs to */
  worldId!: string;

  constructor(data: Partial<WorldObjectProps>) {
    super(data);

    // Assign worldId if provided
    if (data.worldId !== undefined) {
      this.worldId = data.worldId;
    }
  }

  /** Provide default values for mocking a WorldObject */
  static mockDefaults(): Partial<WorldObjectProps> {
    return {
      ...super.mockDefaults(),
      worldId: "",
    };
  }
}
