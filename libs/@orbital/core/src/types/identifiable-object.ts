import { faker } from "@faker-js/faker";
import { WithoutId } from "@orbital/typegoose";
import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { generateUUID } from "../utils/data-generators";
import { BaseObject } from "./base-object";

/**
 * Interface for objects that have a unique identifier
 */
export type IdentifiableObjectProps = z.infer<typeof IdentifiableObjectSchema>;

/** Zod schema for IdentifiableObject */
export const IdentifiableObjectSchema = z
  .object({
    _id: z.string().describe("Unique identifier for the object"),
    createdAt: z
      .date()
      .optional()
      .describe("Timestamp when the object was created"),
    updatedAt: z
      .date()
      .optional()
      .describe("Timestamp when the object was last updated"),
  })
  .describe("An object with a unique identifier and timestamps");

/**
 * IdentifiableObject provides id generation and assignment on top of BaseObject.
 */
@ZodSchema(IdentifiableObjectSchema)
export class IdentifiableObject
  extends BaseObject<IdentifiableObjectProps>
  implements IdentifiableObjectProps
{
  /** Unique identifier, defaults to a random UUID */
  public _id!: string;

  /** Timestamp when the object was created */
  public createdAt?: Date;

  /** Timestamp when the object was last updated */
  public updatedAt?: Date;

  constructor(data?: WithoutId<IdentifiableObjectProps>) {
    const _id = data?._id ?? generateUUID();
    super({ ...data, _id });
    this._id = _id;
    this.createdAt = data?.createdAt;
    this.updatedAt = data?.updatedAt;
  }

  /** Create a mock IdentifiableObject with a random UUID and timestamps */
  static mock(
    overrides: Partial<IdentifiableObjectProps> = {}
  ): IdentifiableObject {
    const now = new Date();
    return new IdentifiableObject({
      _id: overrides._id ?? faker.string.uuid(),
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      ...overrides,
    });
  }
}
