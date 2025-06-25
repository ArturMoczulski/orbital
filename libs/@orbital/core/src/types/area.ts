import { z } from "zod";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
} from "./identifiable-object";
import { Position, PositionSchema } from "./position";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { AreaMap, AreaMapSchema } from "./area-map";

/**
 * Represents a named area with a position.
 */
export type AreaProps = z.infer<typeof AreaSchema>;

/** Zod schema for Area */
export const AreaSchema = z
  .object({
    _id: z.string().optional().describe("Unique identifier for the area"),
    parentId: z
      .string()
      .nullable()
      .optional()
      .describe("Identifier of the parent area, if any"),
    name: z.string().describe("Descriptive name of the area"),
    position: PositionSchema.describe(
      "Central position of the area in 3D space"
    ),
    areaMap: AreaMapSchema.optional().describe(
      "Map representation of this area"
    ),
    worldId: z
      .string()
      .describe("Identifier of the world this area belongs to"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Tags for categorizing the area"),
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
  parentId?: string | null;
  name: string = "";
  position: Position = new Position();
  /** Map representation of this area */
  areaMap?: AreaMap;
  /** Detailed description of the area */
  description: string = "";
  /** Notable landmarks or features in this area */
  landmarks: string[] = [];
  /** Names of other areas this area connects to */
  connections: string[] = [];
  /** Identifier of the world this area belongs to */
  worldId!: string;
  /** Tags for categorizing the area */
  tags: string[] = [];

  /** Create a fake Area instance with randomized data */
  static mock(overrides: Partial<AreaProps> = {}): Area {
    const base: Partial<AreaProps> = {
      parentId: faker.string.uuid(),
      name: faker.lorem.word(),
      position: Position.mock(),
      areaMap:
        overrides.areaMap || (Math.random() > 0.5 ? AreaMap.mock() : undefined),
      worldId: faker.string.uuid(),
      tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
        faker.lorem.word()
      ),
    };
    const area = new Area({ ...base, ...overrides });
    area.description = faker.lorem.paragraph();
    return area;
  }

  constructor(data: unknown) {
    // Validate the data
    const validated = AreaSchema.parse(data);

    // Create a clean object with properly instantiated properties
    const cleanData = {
      _id: (validated as any)._id || randomUUID(),
    };

    // Pass the clean data to the parent constructor
    super(cleanData);

    // Ensure position is properly instantiated as a Position class
    const positionData = validated.position;
    const position =
      positionData instanceof Position
        ? positionData
        : new Position(positionData);

    // Handle areaMap if provided
    let areaMap: AreaMap | undefined = undefined;
    if ((validated as any).areaMap) {
      const areaMapData = (validated as any).areaMap;
      areaMap =
        areaMapData instanceof AreaMap ? areaMapData : new AreaMap(areaMapData);
    }

    // Assign properties directly
    this.name = validated.name;
    this.parentId = validated.parentId;
    this.worldId = (validated as any).worldId;
    // Assign new generated properties
    this.description = (validated as any).description ?? "";
    this.landmarks = (validated as any).landmarks ?? [];
    this.connections = (validated as any).connections ?? [];
    this.tags = (validated as any).tags ?? [];
    this.position = position;
    this.areaMap = areaMap;
  }
}
