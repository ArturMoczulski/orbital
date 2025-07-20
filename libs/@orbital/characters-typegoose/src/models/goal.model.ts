import { prop } from "@typegoose/typegoose";

/**
 * Interface for goal properties
 */
export interface GoalProps {
  purpose: string;
  timeRange: string;
  resources?: string[];
  collaborators?: string[];
  plan?: string[];
}

/**
 * TypeGoose model for embedded Goal sub-document.
 * Implements GoalProps directly to avoid circular dependencies.
 */
export class GoalModel implements GoalProps {
  @prop({ required: true })
  purpose!: string;

  @prop({ required: true })
  timeRange!: string;

  @prop({ type: () => [String] })
  resources?: string[];

  @prop({ type: () => [String] })
  collaborators?: string[];

  @prop({ type: () => [String] })
  plan?: string[];

  constructor(data: Partial<GoalProps> = {}) {
    if (data.purpose !== undefined) this.purpose = data.purpose;
    if (data.timeRange !== undefined) this.timeRange = data.timeRange;
    if (data.resources !== undefined) this.resources = data.resources;
    if (data.collaborators !== undefined)
      this.collaborators = data.collaborators;
    if (data.plan !== undefined) this.plan = data.plan;
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      purpose: this.purpose,
      timeRange: this.timeRange,
      resources: this.resources,
      collaborators: this.collaborators,
      plan: this.plan,
    };
  }
}
