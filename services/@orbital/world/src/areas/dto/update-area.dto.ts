import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { AreaSchema, PositionSchema } from "@orbital/core";

/**
 * Zod schema for updating an area
 * Based on the validation rules from the original class-validator based DTO
 */
const UpdateAreaSchema = AreaSchema.partial().extend({
  name: z.string().min(1).optional().describe("Name of the area"),
  description: z
    .string()
    .min(1)
    .optional()
    .describe("Detailed description of the area"),
  position: PositionSchema.optional().describe(
    "Central position of the area in 3D space"
  ),
  worldId: z
    .string()
    .min(1)
    .optional()
    .describe("Identifier of the world this area belongs to"),
  parentId: z
    .string()
    .nullable()
    .optional()
    .describe("Identifier of the parent area, if any"),
  landmarks: z
    .array(z.string())
    .optional()
    .describe("Notable landmarks or features in this area"),
  connections: z
    .array(z.string())
    .optional()
    .describe("Names of other areas this area connects to"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags for categorizing the area"),
});

/**
 * DTO for updating an area - generated from Zod schema
 * This class acts as a bridge between the Zod schema and NestJS Swagger
 */
export class UpdateAreaDto extends createZodDto(UpdateAreaSchema) {}
