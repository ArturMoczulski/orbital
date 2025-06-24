import { createZodDto } from "nestjs-zod";
import { AreaMapSchema } from "@orbital/core";

/**
 * DTO for AreaMap model - generated from Zod schema
 * This class acts as a bridge between the Zod schema and NestJS Swagger
 */
export class AreaMapDto extends createZodDto(AreaMapSchema) {}
