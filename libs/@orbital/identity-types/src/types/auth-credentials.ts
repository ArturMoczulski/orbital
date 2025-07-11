import { z } from "zod";
import { AuthTypeEnum } from "./auth-type";
import { PasswordCredentialsSchema } from "./password-credentials";

/**
 * Base schema for authentication credentials.
 */
export const AuthCredentialsSchema = z
  .object({
    type: z
      .nativeEnum(AuthTypeEnum)
      .describe("Type of authentication credentials"),
  })
  .describe("Base authentication credentials");

/**
 * Discriminated union of all credential types.
 */
export const AnyCredentialsSchema = z.discriminatedUnion("type", [
  PasswordCredentialsSchema,
]);

export type AuthCredentials = z.infer<typeof AnyCredentialsSchema>;
