import { z } from "zod";
import { AuthTypeEnum } from "./auth-type";

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
 * Type for base authentication credentials.
 */
export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;
