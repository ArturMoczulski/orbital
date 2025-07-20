import { prop } from "@typegoose/typegoose";

/**
 * Interface for desire properties
 */
export interface DesireProps {
  goal: string;
  priority: number;
}

/**
 * TypeGoose model for embedded Desire sub-document.
 * Implements DesireProps directly to avoid circular dependencies.
 */
export class DesireModel implements DesireProps {
  @prop({ required: true })
  goal!: string;

  @prop({ required: true })
  priority!: number;

  constructor(data: Partial<DesireProps> = {}) {
    if (data.goal !== undefined) this.goal = data.goal;
    if (data.priority !== undefined) this.priority = data.priority;
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      goal: this.goal,
      priority: this.priority,
    };
  }
}
