import { z } from "zod";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
} from "./identifiable-object";
import { Position, PositionSchema } from "./position";
import { ZodSchema } from "../decorators/zod-schema.decorator";

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
  /** Detailed description of the area */
  description?: string;
  /** Notable landmarks or features in this area */
  landmarks?: string[];
  /** Names of other areas this area connects to */
  connections?: string[];
}

/** Zod schema for Area */
export const AreaSchema = z
  .object({
    id: z.string().optional().describe("Unique identifier for the area"),
    parentId: z
      .string()
      .optional()
      .describe("Identifier of the parent area, if any"),
    name: z.string().describe("Descriptive name of the area"),
    position: PositionSchema.describe(
      "Central position of the area in 3D space"
    ),
  })
  .describe("A named area in the game world with a specific position");

/**
 * Domain class for Area with auto-assignment and validation.
 */
@ZodSchema(AreaSchema)
export class Area
  extends IdentifiableObject
  implements AreaProps, IdentifiableObjectProps
{
  parentId?: string;
  name: string = "";
  position: Position = new Position();
  /** Detailed description of the area */
  description: string = "";
  /** Notable landmarks or features in this area */
  landmarks: string[] = [];
  /** Names of other areas this area connects to */
  connections: string[] = [];

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
    // Validate the data
    const validated = AreaSchema.parse(data);

    // Create a clean object with properly instantiated properties
    const cleanData = {
      id: (validated as any).id || randomUUID(),
    };

    // Pass the clean data to the parent constructor
    super(cleanData);

    // Ensure position is properly instantiated as a Position class
    const positionData = validated.position;
    const position =
      positionData instanceof Position
        ? positionData
        : new Position(positionData);

    // Assign properties directly
    this.name = validated.name;
    this.parentId = validated.parentId;
    // Assign new generated properties
    this.description = (validated as any).description ?? "";
    this.landmarks = (validated as any).landmarks ?? [];
    this.connections = (validated as any).connections ?? [];
    this.position = position;
  }
}
