import { faker } from "@faker-js/faker";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  IdentifiableObjectSchema,
  ZodSchema,
} from "@orbital/core";
import { z } from "zod";
import { AuthCredentialsSchema } from "./auth-credentials";
import { IdentityProviderEnum } from "./identity-provider";

/**
 * Represents an identity account for a character.
 */
export type IdentityAccountProps = z.infer<typeof IdentityAccountSchema>;

/** Zod schema for IdentityAccount */
export const IdentityAccountSchema = IdentifiableObjectSchema.extend({
  characterId: z
    .string()
    .describe("Identifier of the character associated with this account"),
  provider: z
    .nativeEnum(IdentityProviderEnum)
    .describe("Identity provider platform"),
  identifier: z
    .string()
    .describe("Unique identifier for this account on the provider"),
  credentials: z
    .array(AuthCredentialsSchema)
    .describe("Authentication credentials for this account"),
}).describe("An identity account for a character");

/**
 * Domain class for IdentityAccount with auto-assignment and validation.
 */
@ZodSchema(IdentityAccountSchema)
export class IdentityAccount
  extends IdentifiableObject
  implements IdentityAccountProps, IdentifiableObjectProps
{
  characterId: string = "";
  provider!: IdentityProviderEnum;
  identifier: string = "";
  credentials: z.infer<typeof AuthCredentialsSchema>[] = [];

  /** Create a fake IdentityAccount instance with randomized data */
  static mockDefaults(): Partial<IdentityAccountProps> {
    return {
      characterId: faker.string.uuid(),
      provider: faker.helpers.arrayElement(Object.values(IdentityProviderEnum)),
      identifier: faker.internet.userName(),
    } as Partial<IdentityAccountProps>;
  }

  constructor(data: IdentityAccountProps) {
    // Pass to parent constructor which handles _id
    super(data);

    // Assign properties directly
    this.characterId = data.characterId;
    this.provider = data.provider;
    this.identifier = data.identifier;
    this.credentials = data.credentials || [];
  }
}
