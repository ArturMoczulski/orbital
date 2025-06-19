import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";
import { BaseObject } from "./base-object";
import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";

/**
 * Interface for objects that have a unique identifier
 */
export type IdentifiableObjectProps = z.infer<typeof IdentifiableObjectSchema>;

/** Zod schema for IdentifiableObject */
export const IdentifiableObjectSchema = z
  .object({
    id: z.string().describe("Unique identifier for the object"),
  })
  .describe("An object with a unique identifier");

/**
 * IdentifiableObject provides id generation and assignment on top of BaseObject.
 */
@ZodSchema(IdentifiableObjectSchema)
export class IdentifiableObject
  extends BaseObject<IdentifiableObjectProps>
  implements IdentifiableObjectProps
{
  /** Unique identifier, defaults to a random UUID */
  public id!: string;

  constructor(data?: IdentifiableObjectProps) {
    const id = data?.id ?? randomUUID();
    super({ ...data, id });
    this.id = id;
  }

  /** Create a mock IdentifiableObject with a random UUID */
  static mock(
    overrides: Partial<IdentifiableObjectProps> = {}
  ): IdentifiableObject {
    return new IdentifiableObject({
      id: overrides.id ?? faker.string.uuid(),
      ...overrides,
    });
  }
}
