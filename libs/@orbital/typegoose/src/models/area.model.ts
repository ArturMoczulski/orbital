import { AreaMap, Area as CoreArea, Position } from "@orbital/core";
import { modelOptions, prop } from "@typegoose/typegoose";
import { randomUUID } from "crypto";

@modelOptions({
  schemaOptions: { collection: "areas", timestamps: true },
})
export class Area extends CoreArea {
  // Override _id to add Typegoose decorator
  @prop({ required: true, auto: true, default: () => randomUUID() })
  override _id!: string;

  // Add Typegoose decorators to inherited properties
  @prop({ required: true })
  override name!: string;

  // Make description explicitly required with a default value
  @prop({ required: true, default: "" })
  override description!: string;

  @prop({ type: () => Object, required: false })
  override position?: Position;

  @prop({ type: () => Object })
  override areaMap?: AreaMap;

  @prop()
  override parentId?: string | null;

  @prop({ required: true })
  override worldId!: string;

  @prop({ type: () => [String], default: [] })
  override landmarks!: string[];

  @prop({ type: () => [String], default: [] })
  override connections!: string[];

  @prop({ type: () => [String], default: [] })
  override tags!: string[];

  // Add database-specific properties
  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  constructor(data?: unknown) {
    super(data || {});
  }
}

// Export the Area class as AreaModel for backward compatibility
export { Area as AreaModel };
