import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";
import { BaseObject } from "./base-object";

/**
 * Interface for objects that have a unique identifier
 */
export interface IdentifiableObjectProps {
  /** Unique identifier */
  id: string;
}

/**
 * IdentifiableObject provides id generation and assignment on top of BaseObject.
 */
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
