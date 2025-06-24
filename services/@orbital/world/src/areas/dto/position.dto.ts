import { createZodDto } from "nestjs-zod";
import { PositionSchema } from "@orbital/core";

/**
 * DTO for Position model - generated from Zod schema
 * This class acts as a bridge between the Zod schema and NestJS Swagger
 */
export class PositionDto extends createZodDto(PositionSchema) {}
