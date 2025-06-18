import { z } from "zod";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { BaseObject } from "./base-object";
import { Area, AreaSchema } from "./area";
import { Position, PositionSchema } from "./position";
import { ZodSchema } from "../decorators/zod-schema.decorator";

/**
 * Represents a location with an area and position.
 */
export interface LocationProps {
  /** Area this location belongs to */
  area: Area;
  /** Position of this location */
  position: Position;
  /** Name of the location */
  name: string;
  /** Optional description */
  description?: string;
}

/** Zod schema for Location */
export const LocationSchema = z
  .object({
    area: AreaSchema.describe("Area this location belongs to"),
    position: PositionSchema.describe("Position of this location"),
    name: z.string().describe("Name of the location"),
    description: z
      .string()
      .optional()
      .describe("Optional description of the location"),
  })
  .describe("A location with an area and position");

/**
 * Domain class for Location with auto-assignment and validation.
 */
@ZodSchema(LocationSchema)
export class Location extends BaseObject<Location> implements LocationProps {
  area: Area = new Area({ name: "", position: new Position() });
  position: Position = new Position();
  name: string = "";
  description?: string;

  /** Create a fake Location instance with randomized data */
  static mock(overrides: Partial<LocationProps> = {}): Location {
    const base: Partial<LocationProps> = {
      area: Area.mock(),
      position: Position.mock(),
      name: faker.location.street(),
      description: faker.lorem.sentence(),
    };
    return new Location({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    // Validate the data
    const validated = LocationSchema.parse(data);

    // Pass empty data to the parent constructor
    super();

    // Ensure area is properly instantiated as an Area class
    const areaData = validated.area;
    const area = areaData instanceof Area ? areaData : new Area(areaData);

    // Ensure position is properly instantiated as a Position class
    const positionData = validated.position;
    const position =
      positionData instanceof Position
        ? positionData
        : new Position(positionData);

    // Assign properties directly
    this.area = area;
    this.position = position;
    this.name = validated.name;
    this.description = validated.description;
  }
}
