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
  locations: z.array(z.string()).optional().describe("Locations in this world"),
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
  locations?: string[] = [];

  /** Create a fake World instance with randomized data */
  static mock(overrides: Partial<WorldProps> = {}): World {
    const base: Partial<WorldProps> = {
      name: `World-${faker.location.country()}`,
      shard: faker.string.alphanumeric(8),
      techLevel: faker.number.int({ min: 1, max: 10 }),
      locations: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
        faker.string.uuid()
      ),
    };
    return new World({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    // Validate the data
    const validated = WorldSchema.parse(data);

    // Pass to parent constructor which handles _id
    super(validated);

    // Assign properties directly
    this.name = validated.name;
    this.shard = validated.shard;
    this.techLevel = validated.techLevel;
    this.locations = validated.locations ?? [];
  }
}
