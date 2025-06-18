import { z } from "zod";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
} from "./identifiable-object";
import { Position, PositionSchema } from "./position";

/**
 * Represents a named area with a position.
 */
export interface AreaProps {
  /** Unique identifier */
  id?: string;
  /** Identifier of the parent area */
  parentId?: string;
  /** Area name */
  name: string;
  /** Central position of the area */
  position: Position;
}

/** Zod schema for Area */
export const AreaSchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional(),
  name: z.string(),
  position: PositionSchema,
});

/**
 * Domain class for Area with auto-assignment and validation.
 */
export class Area
  extends IdentifiableObject
  implements AreaProps, IdentifiableObjectProps
{
  parentId?: string;
  name: string = "";
  position: Position = { x: 0, y: 0, z: 0 };

  /** Create a fake Area instance with randomized data */
  static mock(overrides: Partial<AreaProps> = {}): Area {
    const base: Partial<AreaProps> = {
      parentId: faker.string.uuid(),
      name: faker.lorem.word(),
      position: Position.mock(),
    };
    return new Area({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    const validated = AreaSchema.parse(data);
    super({
      id: (validated as any).id || randomUUID(),
    });

    // Ensure position is properly instantiated as a Position class
    const positionData = validated.position;
    const position =
      positionData instanceof Position
        ? positionData
        : new Position(positionData);

    // Assign other properties
    this.name = validated.name;
    this.parentId = validated.parentId;
    this.position = position;
  }
}
