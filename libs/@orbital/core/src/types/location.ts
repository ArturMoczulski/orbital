import { z } from "zod";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { BaseObject } from "./base-object";
import { Area, AreaSchema } from "./area";
import { Position, PositionSchema } from "./position";

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
export const LocationSchema = z.object({
  area: AreaSchema,
  position: PositionSchema,
  name: z.string(),
  description: z.string().optional(),
});

/**
 * Domain class for Location with auto-assignment and validation.
 */
export class Location extends BaseObject<Location> implements LocationProps {
  area!: Area;
  position: Position = { x: 0, y: 0, z: 0 };
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
    const validated = LocationSchema.parse(data);
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

    // Assign properties
    this.area = area;
    this.position = position;
    this.name = validated.name;
    this.description = validated.description;
  }
}
