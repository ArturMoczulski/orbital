import { faker } from "@faker-js/faker";
import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  IdentifiableObjectSchema,
} from "./identifiable-object";

/**
 * Represents a world with a name and tech level.
 */
export type WorldProps = z.infer<typeof WorldSchema>;

/** Zod schema for World */
export const WorldSchema = IdentifiableObjectSchema.extend({
  name: z.string().describe("Name of the world"),
  shard: z.string().describe("Shard identifier for the world"),
  techLevel: z.number().describe("Technology level of the world"),
}).describe("A world in the game universe");

/**
 * Domain class for World with auto-assignment and validation.
 */
@ZodSchema(WorldSchema)
export class World
  extends IdentifiableObject
  implements WorldProps, IdentifiableObjectProps
{
  name: string = "";
  shard: string = "";
  techLevel: number = 1;

  /** Create a fake World instance with randomized data */
  static mockDefaults(): Partial<WorldProps> {
    return {
      shard: faker.string.alphanumeric(8),
      techLevel: faker.number.int({ min: 1, max: 10 }),
    } as Partial<WorldProps>;
  }

  constructor(data: WorldProps) {
    // Pass to parent constructor which handles _id
    super(data);

    // Assign properties directly
    this.name = data.name;
    this.shard = data.shard;
    this.techLevel = data.techLevel;
  }
}
