import { faker } from "@faker-js/faker";
import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { generateUUID } from "../utils/data-generators";
import { BaseObject } from "./base-object";

/**
 * Utility type to remove the _id field from a type
 * @template T The type to remove _id from
 */
export type WithoutId<T> = Omit<T, "_id">;

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

  constructor(data?: Partial<IdentifiableObjectProps>) {
    // Generate a new UUID if none is provided
    const uuid = data?._id ?? generateUUID();

    // Create a copy of data without _id for super constructor
    const { _id: _, ...dataWithoutId } = data || {};

    // Call super with data without _id
    super(dataWithoutId);

    // Set _id directly as a property
    this._id = uuid;

    this.createdAt = data?.createdAt;
    this.updatedAt = data?.updatedAt;
  }

  /** Create a mock IdentifiableObject with a random UUID and timestamps */
  static mock(
    overrides: Partial<IdentifiableObjectProps> = {}
  ): IdentifiableObject {
    const now = new Date();
    const uuid = overrides._id ?? faker.string.uuid();

    // Create the instance with _id explicitly included
    const instance = new IdentifiableObject({
      _id: uuid,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      ...overrides,
    });

    return instance;
  }
}
