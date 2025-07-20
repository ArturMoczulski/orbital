import { prop } from "@typegoose/typegoose";

/**
 * Interface for intention properties
 */
export interface IntentionProps {
  plan: string;
  due: Date;
}

/**
 * TypeGoose model for embedded Intention sub-document.
 * Implements IntentionProps directly to avoid circular dependencies.
 */
export class IntentionModel implements IntentionProps {
  @prop({ required: true })
  plan!: string;

  @prop({ required: true })
  due!: Date;

  constructor(data: Partial<IntentionProps> = {}) {
    if (data.plan !== undefined) this.plan = data.plan;
    if (data.due !== undefined) this.due = data.due;
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      plan: this.plan,
      due: this.due,
    };
  }
}
