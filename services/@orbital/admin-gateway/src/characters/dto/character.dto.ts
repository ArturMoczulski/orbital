import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for creating a new character
 * This is inferred from the CharacterSchema in @orbital/characters but without the _id field
 */
export class CreateCharacterDto {
  @ApiPropertyOptional({
    description: "Optional formal title (e.g., Sir, Lady)",
  })
  title?: string;

  @ApiProperty({ description: "First, given name" })
  firstName!: string;

  @ApiProperty({ description: "Last, family name" })
  lastName!: string;

  @ApiPropertyOptional({
    description: "Character's historical events",
    type: [Object],
  })
  history?: {
    event: string;
    date?: string;
    location?: string;
    significance?: number;
  }[];

  @ApiPropertyOptional({
    description: "Character's current location ID",
  })
  currentLocation?: string;

  @ApiPropertyOptional({
    description: "World ID this character belongs to",
  })
  worldId?: string;

  @ApiPropertyOptional({
    description: "Character's description",
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Character's attributes",
    type: Object,
  })
  attributes?: Record<string, number>;

  @ApiPropertyOptional({
    description: "Character's skills",
    type: [Object],
  })
  skills?: any[];

  @ApiPropertyOptional({
    description: "Character's memories",
    type: [Object],
  })
  memories?: any[];

  @ApiPropertyOptional({
    description: "Character's relations with other characters",
    type: [Object],
  })
  relations?: any[];
}

/**
 * DTO for updating an existing character
 * This is a partial version of CreateCharacterDto
 */
export class UpdateCharacterDto implements Partial<CreateCharacterDto> {
  @ApiPropertyOptional({
    description: "Optional formal title (e.g., Sir, Lady)",
  })
  title?: string;

  @ApiPropertyOptional({ description: "First, given name" })
  firstName?: string;

  @ApiPropertyOptional({ description: "Last, family name" })
  lastName?: string;

  @ApiPropertyOptional({
    description: "Character's historical events",
    type: [Object],
  })
  history?: {
    event: string;
    date?: string;
    location?: string;
    significance?: number;
  }[];

  @ApiPropertyOptional({
    description: "Character's current location ID",
  })
  currentLocation?: string;

  @ApiPropertyOptional({
    description: "World ID this character belongs to",
  })
  worldId?: string;

  @ApiPropertyOptional({
    description: "Character's description",
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Character's attributes",
    type: Object,
  })
  attributes?: Record<string, number>;

  @ApiPropertyOptional({
    description: "Character's skills",
    type: [Object],
  })
  skills?: any[];

  @ApiPropertyOptional({
    description: "Character's memories",
    type: [Object],
  })
  memories?: any[];

  @ApiPropertyOptional({
    description: "Character's relations with other characters",
    type: [Object],
  })
  relations?: any[];
}
