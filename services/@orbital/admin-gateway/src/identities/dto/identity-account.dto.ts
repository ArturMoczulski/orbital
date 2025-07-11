import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for creating a new identity account
 * This is inferred from the IdentityAccountSchema in @orbital/identity-types but without the _id field
 */
export class CreateIdentityAccountDto {
  @ApiProperty({
    description: "Identifier of the character associated with this account",
  })
  characterId!: string;

  @ApiProperty({ description: "Identity provider platform" })
  provider!: string;

  @ApiProperty({
    description: "Unique identifier for this account on the provider",
  })
  identifier!: string;

  @ApiPropertyOptional({
    description: "Authentication credentials for this account",
    type: [Object],
  })
  credentials?: any[];
}

/**
 * DTO for updating an existing identity account
 * This is a partial version of CreateIdentityAccountDto
 */
export class UpdateIdentityAccountDto
  implements Partial<CreateIdentityAccountDto>
{
  @ApiPropertyOptional({
    description: "Identifier of the character associated with this account",
  })
  characterId?: string;

  @ApiPropertyOptional({ description: "Identity provider platform" })
  provider?: string;

  @ApiPropertyOptional({
    description: "Unique identifier for this account on the provider",
  })
  identifier?: string;

  @ApiPropertyOptional({
    description: "Authentication credentials for this account",
    type: [Object],
  })
  credentials?: any[];
}
