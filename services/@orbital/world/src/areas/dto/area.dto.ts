import { createZodDto } from "nestjs-zod";
import { AreaSchema } from "@orbital/core";

/**
 * DTO for Area model - generated from Zod schema
 * This class acts as a bridge between the Zod schema and NestJS Swagger
 */
export class AreaDto extends createZodDto(AreaSchema) {}
