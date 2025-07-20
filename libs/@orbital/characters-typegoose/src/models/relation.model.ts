import { prop } from "@typegoose/typegoose";

/**
 * Interface for relation properties
 */
export interface RelationProps {
  targetId: string;
  type: string;
  strength: number;
}

/**
 * TypeGoose model for embedded Relation sub-document.
 * Implements RelationProps directly to avoid circular dependencies.
 */
export class RelationModel implements RelationProps {
  @prop({ required: true })
  targetId!: string;

  @prop({ required: true })
  type!: string;

  @prop({ required: true })
  strength!: number;

  constructor(data: Partial<RelationProps> = {}) {
    if (data.targetId !== undefined) this.targetId = data.targetId;
    if (data.type !== undefined) this.type = data.type;
    if (data.strength !== undefined) this.strength = data.strength;
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      targetId: this.targetId,
      type: this.type,
      strength: this.strength,
    };
  }
}
