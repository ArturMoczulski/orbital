import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { generateUUID } from "../utils/data-generators";
import { BaseObject, OptionalId } from "./base-object";
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
    tags: z
      .array(z.string())
      .optional()
      .describe("Array of tags associated with the object"),
  })
  .describe("An object with a unique identifier, timestamps, and tags");

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
  public createdAt!: Date;

  /** Timestamp when the object was last updated */
  public updatedAt!: Date;

  /** Array of tags associated with the object */
  public tags?: string[];

  constructor(data?: OptionalId<IdentifiableObjectProps>) {
    // Generate a new UUID if none is provided
    const uuid = data?._id ?? generateUUID();

    // Call super with the full data
    super(data);

    // Set _id directly as a property, ensuring it takes precedence
    this._id = uuid;

    // Set timestamps with defaults if not provided
    this.createdAt = data?.createdAt || new Date();
    this.updatedAt = data?.updatedAt || new Date();

    // Set tags if provided
    if (data?.tags) {
      this.tags = data.tags;
    }
  }

  /** Provide default values for mocking an IdentifiableObject */
  static mockDefaults(): Partial<IdentifiableObjectProps> {
    const now = new Date();

    return {
      _id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      tags: [],
    };
  }
}
