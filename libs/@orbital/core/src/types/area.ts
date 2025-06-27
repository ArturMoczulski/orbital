import { faker } from "@faker-js/faker";
import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { generateFantasyAreaName } from "../utils/data-generators";
import { AreaMap, AreaMapSchema } from "./area-map";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  IdentifiableObjectSchema,
} from "./identifiable-object";
import { Position, PositionSchema } from "./position";

// Use the generateUUID function from data-generators.ts

/**
 * Represents a named area with a position.
 */
export type AreaProps = z.infer<typeof AreaSchema>;

/** Zod schema for Area */
export const AreaSchema = IdentifiableObjectSchema.extend({
  parentId: z
    .string()
    .nullable()
    .optional()
    .describe("Identifier of the parent area, if any"),
  name: z.string().describe("Descriptive name of the area"),
  position: PositionSchema.optional().describe(
    "Central position of the area in 3D space"
  ),
  areaMap: AreaMapSchema.optional().describe("Map representation of this area"),
  worldId: z.string().describe("Identifier of the world this area belongs to"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags for categorizing the area"),
}).describe("A named area in the game world with a specific position");

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
  position?: Position;
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
    // No need to select a style explicitly as it's random by default
    const base: Partial<AreaProps> = {
      parentId: faker.string.uuid(),
      // Generate a rich fantasy name with the enhanced generator
      name: generateFantasyAreaName({
        // Style is random by default
        includeAdjective: Math.random() > 0.3, // 70% chance to include an adjective
        includeLocationType: Math.random() > 0.1, // 90% chance to include a location type
        allowCompoundNames: Math.random() > 0.7, // 30% chance for compound names
      }),
      // Position is optional, but include it in mock by default unless explicitly set to undefined
      position: "position" in overrides ? overrides.position : Position.mock(),
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

    // Pass to parent constructor which handles _id
    super(validated);

    // Handle position if provided
    let position: Position | undefined = undefined;
    if (validated.position) {
      const positionData = validated.position;
      position =
        positionData instanceof Position
          ? positionData
          : new Position(positionData);
    }

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
