import { z } from "zod";
import { AuthCredentialsSchema } from "./auth-credentials";
import { AuthTypeEnum } from "./auth-type";

/**
 * Schema for password-based authentication credentials.
 */
export const PasswordCredentialsSchema = AuthCredentialsSchema.extend({
  type: z.literal(AuthTypeEnum.PASSWORD),
  username: z.string().describe("Username for password authentication"),
  // In a real system, you'd store a hashed password, not the plain text
  hashedPassword: z.string().describe("Hashed password"),
  salt: z.string().optional().describe("Salt used for password hashing"),
}).describe("Password-based authentication credentials");

/**
 * Type for password credentials.
 */
export type PasswordCredentials = z.infer<typeof PasswordCredentialsSchema>;
