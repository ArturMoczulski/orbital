import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AreaMapSchema, PositionSchema } from "@orbital/core";
import { z } from "zod";

/**
 * DTO for creating a new area
 * This is inferred from the AreaSchema in @orbital/core but without the _id field
 */
export class CreateAreaDto {
  @ApiProperty({ description: "Descriptive name of the area" })
  name!: string;

  @ApiProperty({ description: "Identifier of the world this area belongs to" })
  worldId!: string;

  @ApiPropertyOptional({ description: "Identifier of the parent area, if any" })
  parentId?: string | null;

  @ApiPropertyOptional({
    description: "Central position of the area in 3D space",
    type: "object",
    properties: {
      x: {
        type: "number",
        description: "X coordinate of the position, in meters from origin",
      },
      y: {
        type: "number",
        description: "Y coordinate of the position, in meters from origin",
      },
      z: {
        type: "number",
        description: "Z coordinate (height), in meters above ground",
      },
    },
  })
  position?: z.infer<typeof PositionSchema>;

  @ApiPropertyOptional({
    description: "Map representation of this area",
    type: "object",
    properties: {
      width: { type: "number", description: "Width of the map in cells" },
      height: { type: "number", description: "Height of the map in cells" },
      grid: {
        type: "array",
        description: "2D grid of map tiles",
        items: {
          type: "array",
          items: { type: "number" },
        },
      },
    },
  })
  areaMap?: z.infer<typeof AreaMapSchema>;

  @ApiPropertyOptional({
    description: "Tags for categorizing the area",
    type: "array",
    items: { type: "string" },
  })
  tags?: string[];

  @ApiPropertyOptional({ description: "Detailed description of the area" })
  description?: string;

  @ApiPropertyOptional({
    description: "Notable landmarks or features in this area",
    type: "array",
    items: { type: "string" },
  })
  landmarks?: string[];

  @ApiPropertyOptional({
    description: "Names of other areas this area connects to",
    type: "array",
    items: { type: "string" },
  })
  connections?: string[];
}

/**
 * DTO for updating an existing area
 * This is a partial version of CreateAreaDto
 */
export class UpdateAreaDto implements Partial<CreateAreaDto> {
  @ApiPropertyOptional({ description: "Descriptive name of the area" })
  name?: string;

  @ApiPropertyOptional({
    description: "Identifier of the world this area belongs to",
  })
  worldId?: string;

  @ApiPropertyOptional({ description: "Identifier of the parent area, if any" })
  parentId?: string | null;

  @ApiPropertyOptional({
    description: "Central position of the area in 3D space",
    type: "object",
    properties: {
      x: {
        type: "number",
        description: "X coordinate of the position, in meters from origin",
      },
      y: {
        type: "number",
        description: "Y coordinate of the position, in meters from origin",
      },
      z: {
        type: "number",
        description: "Z coordinate (height), in meters above ground",
      },
    },
  })
  position?: z.infer<typeof PositionSchema>;

  @ApiPropertyOptional({
    description: "Map representation of this area",
    type: "object",
    properties: {
      width: { type: "number", description: "Width of the map in cells" },
      height: { type: "number", description: "Height of the map in cells" },
      grid: {
        type: "array",
        description: "2D grid of map tiles",
        items: {
          type: "array",
          items: { type: "number" },
        },
      },
    },
  })
  areaMap?: z.infer<typeof AreaMapSchema>;

  @ApiPropertyOptional({
    description: "Tags for categorizing the area",
    type: "array",
    items: { type: "string" },
  })
  tags?: string[];

  @ApiPropertyOptional({ description: "Detailed description of the area" })
  description?: string;

  @ApiPropertyOptional({
    description: "Notable landmarks or features in this area",
    type: "array",
    items: { type: "string" },
  })
  landmarks?: string[];

  @ApiPropertyOptional({
    description: "Names of other areas this area connects to",
    type: "array",
    items: { type: "string" },
  })
  connections?: string[];
}
