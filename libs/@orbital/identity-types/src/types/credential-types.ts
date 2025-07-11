import { z } from "zod";
import { PasswordCredentialsSchema } from "./password-credentials";

/**
 * Discriminated union of all credential types.
 */
export const AnyCredentialsSchema = z.discriminatedUnion("type", [
  PasswordCredentialsSchema,
]);

/**
 * Type for any authentication credentials.
 */
export type AnyCredentials = z.infer<typeof AnyCredentialsSchema>;
