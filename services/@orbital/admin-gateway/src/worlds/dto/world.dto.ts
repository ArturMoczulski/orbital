import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for creating a new world
 * This is inferred from the WorldSchema in @orbital/core but without the _id field
 */
export class CreateWorldDto {
  @ApiProperty({ description: "Descriptive name of the world" })
  name!: string;

  @ApiProperty({ description: "Shard identifier for the world" })
  shard!: string;

  @ApiProperty({ description: "Technology level of the world" })
  techLevel!: number;
}

/**
 * DTO for updating an existing world
 * This is a partial version of CreateWorldDto
 */
export class UpdateWorldDto implements Partial<CreateWorldDto> {
  @ApiPropertyOptional({ description: "Descriptive name of the world" })
  name?: string;

  @ApiPropertyOptional({ description: "Shard identifier for the world" })
  shard?: string;

  @ApiPropertyOptional({ description: "Technology level of the world" })
  techLevel?: number;
}
