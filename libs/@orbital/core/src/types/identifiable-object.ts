import { faker } from "@faker-js/faker";
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
  public _id!: string;

  constructor(data?: IdentifiableObjectProps) {
    const _id = data?._id ?? generateUUID();
    super({ ...data, _id });
    this._id = _id;
  }

  /** Create a mock IdentifiableObject with a random UUID */
  static mock(
    overrides: Partial<IdentifiableObjectProps> = {}
  ): IdentifiableObject {
    return new IdentifiableObject({
      _id: overrides._id ?? faker.string.uuid(),
      ...overrides,
    });
  }
}
